import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Quiz } from './types/quiz'
import { StartScreen } from './components/StartScreen'
import type { FilterOptions } from './components/StartScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import { StatsScreen } from './components/StatsScreen'
import './App.css'

type Phase = 'start' | 'quiz' | 'result' | 'stats'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_JWT_KEY = import.meta.env.VITE_SUPABASE_JWT_KEY

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type AnswerRecord = {
  quiz_id: string
  category: string
  difficulty: string
  is_correct: boolean
}

function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [current, setCurrent] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError('クイズの取得に失敗しました')
    } else {
      setAllQuizzes(data as Quiz[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const handleStart = ({ category, difficulty, shuffle: doShuffle, count }: FilterOptions) => {
    let filtered = allQuizzes
    if (category !== 'すべて') filtered = filtered.filter((q) => q.category === category)
    if (difficulty !== 'すべて') filtered = filtered.filter((q) => q.difficulty === difficulty)
    if (filtered.length === 0) {
      setError('条件に合う問題が見つかりません')
      return
    }
    const picked = doShuffle ? shuffle(filtered) : filtered
    setQuizzes(picked.slice(0, count))
    setCurrent(0)
    setCorrect(0)
    setAnswers([])
    setPhase('quiz')
  }

  const handleGenerate = async (category: string) => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_JWT_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, count: 5 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuizzes(data.quizzes as Quiz[])
      setCurrent(0)
      setCorrect(0)
      setAnswers([])
      setPhase('quiz')
    } catch {
      setError('問題の生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    const quiz = quizzes[current]
    const is_correct = answer === quiz.correct_answer
    const record: AnswerRecord = {
      quiz_id: quiz.id,
      category: quiz.category,
      difficulty: quiz.difficulty,
      is_correct,
    }

    if (is_correct) setCorrect((c) => c + 1)

    const newAnswers = [...answers, record]
    setAnswers(newAnswers)

    if (current + 1 < quizzes.length) {
      setCurrent((c) => c + 1)
    } else {
      await supabase.from('quiz_results').insert(newAnswers)
      setPhase('result')
    }
  }

  if (loading) return <div className="screen"><p>読み込み中...</p></div>
  if (error) return <div className="screen"><p>{error}</p><button onClick={() => setError(null)}>戻る</button></div>

  return (
    <>
      {phase === 'start' && (
        <StartScreen
          onStart={handleStart}
          onGenerate={handleGenerate}
          generating={generating}
          onStats={() => setPhase('stats')}
        />
      )}
      {phase === 'quiz' && quizzes.length > 0 && (
        <QuizScreen
          quiz={quizzes[current]}
          current={current + 1}
          total={quizzes.length}
          onAnswer={handleAnswer}
        />
      )}
      {phase === 'result' && (
        <ResultScreen
          correct={correct}
          total={quizzes.length}
          onRestart={() => setPhase('start')}
          onStats={() => setPhase('stats')}
        />
      )}
      {phase === 'stats' && (
        <StatsScreen onBack={() => setPhase('start')} />
      )}
    </>
  )
}

export default App
