import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Quiz } from './types/quiz'
import { StartScreen } from './components/StartScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import './App.css'

type Phase = 'start' | 'quiz' | 'result'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [current, setCurrent] = useState(0)
  const [correct, setCorrect] = useState(0)
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
      setQuizzes(data as Quiz[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const handleGenerate = async (category: string) => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, count: 5 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuizzes(data.quizzes as Quiz[])
      setCurrent(0)
      setCorrect(0)
      setPhase('quiz')
    } catch (e) {
      setError('問題の生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const handleStart = () => {
    setCurrent(0)
    setCorrect(0)
    setPhase('quiz')
  }

  const handleAnswer = (answer: string) => {
    if (answer === quizzes[current].correct_answer) {
      setCorrect((c) => c + 1)
    }
    if (current + 1 < quizzes.length) {
      setCurrent((c) => c + 1)
    } else {
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
        />
      )}
    </>
  )
}

export default App
