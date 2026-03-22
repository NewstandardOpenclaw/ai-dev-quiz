import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

type Stat = { total: number; correct: number; rate: number }

type QuizStat = Stat & {
  quiz_id: string
  question: string
  category: string
  difficulty: string
}

type RawResult = {
  quiz_id: string
  category: string
  difficulty: string
  is_correct: boolean
}

const CATEGORIES = [
  'すべて',
  'S3', 'Lambda', 'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'EC2', 'IAM',
  'Kinesis', 'EventBridge', 'Cognito', 'KMS', 'Secrets Manager',
  'CloudWatch', 'X-Ray',
  'CodeCommit', 'CodeBuild', 'CodeDeploy', 'CodePipeline',
  'Elastic Beanstalk', 'CloudFormation', 'SAM',
  'ECS', 'ECR', 'Step Functions', 'ElastiCache',
]
const DIFFICULTIES = ['すべて', 'easy', 'medium', 'hard']

const DOMAINS = [
  {
    name: 'AWSサービスを使った開発',
    weight: 32,
    categories: ['Lambda', 'S3', 'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'Kinesis', 'EventBridge', 'Step Functions', 'Cognito', 'ECS', 'ECR', 'ElastiCache'],
  },
  {
    name: 'セキュリティ',
    weight: 26,
    categories: ['IAM', 'KMS', 'Secrets Manager', 'Cognito'],
  },
  {
    name: 'デプロイメント',
    weight: 24,
    categories: ['Elastic Beanstalk', 'CloudFormation', 'SAM', 'CodeCommit', 'CodeBuild', 'CodeDeploy', 'CodePipeline', 'ECS', 'ECR', 'EC2'],
  },
  {
    name: 'トラブルシューティングと最適化',
    weight: 18,
    categories: ['CloudWatch', 'X-Ray'],
  },
]

type Props = {
  onBack: () => void
}

export function StatsScreen({ onBack }: Props) {
  const [allResults, setAllResults] = useState<RawResult[]>([])
  const [allQuizStats, setAllQuizStats] = useState<QuizStat[]>([])
  const [category, setCategory] = useState('すべて')
  const [difficulty, setDifficulty] = useState('すべて')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: results } = await supabase.from('quiz_results').select('*')
      if (!results || results.length === 0) {
        setLoading(false)
        return
      }
      setAllResults(results)

      const byQuiz: Record<string, { total: number; correct: number; category: string; difficulty: string }> = {}
      for (const r of results) {
        if (!byQuiz[r.quiz_id]) byQuiz[r.quiz_id] = { total: 0, correct: 0, category: r.category, difficulty: r.difficulty }
        byQuiz[r.quiz_id].total++
        if (r.is_correct) byQuiz[r.quiz_id].correct++
      }

      const quizIds = Object.keys(byQuiz)
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, question')
        .in('id', quizIds)

      const quizMap: Record<string, string> = {}
      for (const q of quizzes ?? []) quizMap[q.id] = q.question

      setAllQuizStats(
        quizIds.map((id) => ({
          quiz_id: id,
          question: quizMap[id] ?? '（問題が削除されました）',
          category: byQuiz[id].category,
          difficulty: byQuiz[id].difficulty,
          total: byQuiz[id].total,
          correct: byQuiz[id].correct,
          rate: Math.round((byQuiz[id].correct / byQuiz[id].total) * 100),
        }))
      )
      setLoading(false)
    }
    fetchStats()
  }, [])

  const filtered = useMemo(() => {
    return allResults.filter((r) => {
      if (category !== 'すべて' && r.category !== category) return false
      if (difficulty !== 'すべて' && r.difficulty !== difficulty) return false
      return true
    })
  }, [allResults, category, difficulty])

  const totalCount = filtered.length
  const totalCorrect = filtered.filter((r) => r.is_correct).length

  const categoryStats = useMemo(() => {
    const by: Record<string, { total: number; correct: number }> = {}
    for (const r of filtered) {
      if (!by[r.category]) by[r.category] = { total: 0, correct: 0 }
      by[r.category].total++
      if (r.is_correct) by[r.category].correct++
    }
    return Object.entries(by)
      .map(([label, s]) => ({ label, ...s, rate: Math.round((s.correct / s.total) * 100) }))
      .sort((a, b) => a.rate - b.rate)
  }, [filtered])

  const difficultyStats = useMemo(() => {
    const by: Record<string, { total: number; correct: number }> = {}
    for (const r of filtered) {
      if (!by[r.difficulty]) by[r.difficulty] = { total: 0, correct: 0 }
      by[r.difficulty].total++
      if (r.is_correct) by[r.difficulty].correct++
    }
    return Object.entries(by)
      .map(([label, s]) => ({ label, ...s, rate: Math.round((s.correct / s.total) * 100) }))
  }, [filtered])

  const filteredQuizIds = useMemo(() => new Set(filtered.map((r) => r.quiz_id)), [filtered])

  const quizStats = useMemo(() => {
    return allQuizStats
      .filter((s) => filteredQuizIds.has(s.quiz_id))
      .sort((a, b) => a.rate - b.rate)
  }, [allQuizStats, filteredQuizIds])

  if (loading) return <div className="screen"><p>読み込み中...</p></div>

  return (
    <div className="screen">
      <h1>統計</h1>

      {allResults.length === 0 ? (
        <p>まだ回答データがありません。クイズを解いてみましょう！</p>
      ) : (
        <>
          <div className="filter-section">
            <p className="filter-label">カテゴリ</p>
            <div className="filter-buttons">
              {CATEGORIES.map((cat) => (
                <button key={cat} className={category === cat ? 'active' : ''} onClick={() => setCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <p className="filter-label">難易度</p>
            <div className="filter-buttons">
              {DIFFICULTIES.map((d) => (
                <button key={d} className={difficulty === d ? 'active' : ''} onClick={() => setDifficulty(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {totalCount === 0 ? (
            <p>条件に合うデータがありません。</p>
          ) : (
            <>
              <div className="stat-summary">
                <p className="stat-summary-label">総合正答率</p>
                <p className="stat-summary-rate">{Math.round((totalCorrect / totalCount) * 100)}%</p>
                <p className="stat-summary-count">{totalCount}問中 {totalCorrect}問正解</p>
              </div>

              {category === 'すべて' && (
                <div className="stat-section">
                  <p className="stat-section-title">カテゴリ別</p>
                  {categoryStats.map((s) => (
                    <div key={s.label} className="stat-row">
                      <span className="stat-label">{s.label}</span>
                      <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: `${s.rate}%` }} /></div>
                      <span className="stat-rate">{s.rate}%</span>
                      <span className="stat-count">{s.correct}/{s.total}</span>
                    </div>
                  ))}
                </div>
              )}

              {difficulty === 'すべて' && (
                <div className="stat-section">
                  <p className="stat-section-title">難易度別</p>
                  {difficultyStats.map((s) => (
                    <div key={s.label} className="stat-row">
                      <span className="stat-label">{s.label}</span>
                      <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: `${s.rate}%` }} /></div>
                      <span className="stat-rate">{s.rate}%</span>
                      <span className="stat-count">{s.correct}/{s.total}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'すべて' && (
                <div className="stat-section">
                  <p className="stat-section-title">DVA試験ドメイン別（出題比率）</p>
                  {DOMAINS.map((domain) => {
                    const domainResults = filtered.filter((r) => domain.categories.includes(r.category))
                    const domainTotal = domainResults.length
                    const domainCorrect = domainResults.filter((r) => r.is_correct).length
                    const domainRate = domainTotal > 0 ? Math.round((domainCorrect / domainTotal) * 100) : null
                    return (
                      <div key={domain.name} className="stat-domain-row">
                        <div className="stat-domain-header">
                          <span className="stat-label">{domain.name}</span>
                          <span className="stat-domain-weight">試験比率 {domain.weight}%</span>
                        </div>
                        {domainRate !== null ? (
                          <>
                            <div className="stat-domain-bars">
                              <div className="stat-domain-bar-item">
                                <span className="stat-domain-bar-label">正答率</span>
                                <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: `${domainRate}%` }} /></div>
                                <span className="stat-rate">{domainRate}%</span>
                                <span className="stat-count">{domainCorrect}/{domainTotal}</span>
                              </div>
                              <div className="stat-domain-bar-item">
                                <span className="stat-domain-bar-label">出題比率</span>
                                <div className="stat-bar-wrap"><div className="stat-bar stat-bar-accent" style={{ width: `${domain.weight}%` }} /></div>
                                <span className="stat-rate">{domain.weight}%</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="stat-domain-empty">未回答</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="stat-section">
                <p className="stat-section-title">問題別（正答率の低い順）</p>
                {quizStats.map((s) => (
                  <div key={s.quiz_id} className="stat-quiz-row">
                    <div className="stat-quiz-header">
                      <span className="stat-quiz-meta">{s.category} · {s.difficulty}</span>
                      <span className="stat-rate">{s.rate}%</span>
                      <span className="stat-count">{s.correct}/{s.total}</span>
                    </div>
                    <p className="stat-quiz-question">{s.question}</p>
                    <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: `${s.rate}%` }} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button onClick={onBack}>戻る</button>
    </div>
  )
}
