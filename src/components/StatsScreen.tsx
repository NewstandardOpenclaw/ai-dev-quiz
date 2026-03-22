import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Stat = { total: number; correct: number; rate: number }

type QuizStat = Stat & {
  quiz_id: string
  question: string
  category: string
  difficulty: string
}

type Props = {
  onBack: () => void
}

export function StatsScreen({ onBack }: Props) {
  const [categoryStats, setCategoryStats] = useState<(Stat & { label: string })[]>([])
  const [difficultyStats, setDifficultyStats] = useState<(Stat & { label: string })[]>([])
  const [quizStats, setQuizStats] = useState<QuizStat[]>([])
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: results } = await supabase.from('quiz_results').select('*')
      if (!results || results.length === 0) {
        setLoading(false)
        return
      }

      setTotalCount(results.length)
      setTotalCorrect(results.filter((r) => r.is_correct).length)

      const byCategory: Record<string, { total: number; correct: number }> = {}
      const byDifficulty: Record<string, { total: number; correct: number }> = {}
      const byQuiz: Record<string, { total: number; correct: number; category: string; difficulty: string }> = {}

      for (const r of results) {
        if (!byCategory[r.category]) byCategory[r.category] = { total: 0, correct: 0 }
        byCategory[r.category].total++
        if (r.is_correct) byCategory[r.category].correct++

        if (!byDifficulty[r.difficulty]) byDifficulty[r.difficulty] = { total: 0, correct: 0 }
        byDifficulty[r.difficulty].total++
        if (r.is_correct) byDifficulty[r.difficulty].correct++

        if (!byQuiz[r.quiz_id]) byQuiz[r.quiz_id] = { total: 0, correct: 0, category: r.category, difficulty: r.difficulty }
        byQuiz[r.quiz_id].total++
        if (r.is_correct) byQuiz[r.quiz_id].correct++
      }

      setCategoryStats(
        Object.entries(byCategory)
          .map(([label, s]) => ({ label, ...s, rate: Math.round((s.correct / s.total) * 100) }))
          .sort((a, b) => a.rate - b.rate)
      )
      setDifficultyStats(
        Object.entries(byDifficulty)
          .map(([label, s]) => ({ label, ...s, rate: Math.round((s.correct / s.total) * 100) }))
      )

      const quizIds = Object.keys(byQuiz)
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, question, category, difficulty')
        .in('id', quizIds)

      const quizMap: Record<string, { question: string }> = {}
      for (const q of quizzes ?? []) quizMap[q.id] = q

      setQuizStats(
        quizIds
          .map((id) => ({
            quiz_id: id,
            question: quizMap[id]?.question ?? '（問題が削除されました）',
            category: byQuiz[id].category,
            difficulty: byQuiz[id].difficulty,
            total: byQuiz[id].total,
            correct: byQuiz[id].correct,
            rate: Math.round((byQuiz[id].correct / byQuiz[id].total) * 100),
          }))
          .sort((a, b) => a.rate - b.rate)
      )

      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return <div className="screen"><p>読み込み中...</p></div>

  return (
    <div className="screen">
      <h1>統計</h1>

      {totalCount === 0 ? (
        <p>まだ回答データがありません。クイズを解いてみましょう！</p>
      ) : (
        <>
          <div className="stat-summary">
            <p className="score">{totalCorrect} / {totalCount}</p>
            <p className="percentage">総合正答率 {Math.round((totalCorrect / totalCount) * 100)}%</p>
          </div>

          <div className="stat-section">
            <h2>カテゴリ別</h2>
            {categoryStats.map((s) => (
              <div key={s.label} className="stat-row">
                <span className="stat-label">{s.label}</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar" style={{ width: `${s.rate}%` }} />
                </div>
                <span className="stat-rate">{s.rate}%</span>
                <span className="stat-count">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>

          <div className="stat-section">
            <h2>難易度別</h2>
            {difficultyStats.map((s) => (
              <div key={s.label} className="stat-row">
                <span className="stat-label">{s.label}</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar" style={{ width: `${s.rate}%` }} />
                </div>
                <span className="stat-rate">{s.rate}%</span>
                <span className="stat-count">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>

          <div className="stat-section">
            <h2>問題別（正答率の低い順）</h2>
            {quizStats.map((s) => (
              <div key={s.quiz_id} className="stat-quiz-row">
                <div className="stat-quiz-header">
                  <span className="stat-quiz-meta">{s.category} · {s.difficulty}</span>
                  <span className="stat-rate">{s.rate}%</span>
                  <span className="stat-count">{s.correct}/{s.total}</span>
                </div>
                <p className="stat-quiz-question">{s.question}</p>
                <div className="stat-bar-wrap">
                  <div className="stat-bar" style={{ width: `${s.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={onBack}>戻る</button>
    </div>
  )
}
