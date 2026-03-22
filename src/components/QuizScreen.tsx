import { useState } from 'react'
import type { Quiz } from '../types/quiz'

type Props = {
  quiz: Quiz
  current: number
  total: number
  onAnswer: (answer: string) => void
}

export function QuizScreen({ quiz, current, total, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
  }

  const handleNext = () => {
    if (!selected) return
    onAnswer(selected)
    setSelected(null)
  }

  const getButtonStyle = (option: string) => {
    if (!selected) return ''
    if (option === quiz.correct_answer) return 'correct'
    if (option === selected) return 'wrong'
    return ''
  }

  const progressPct = Math.round(((current - 1) / total) * 100)

  return (
    <div className="screen">
      <div className="quiz-progress">
        <div className="quiz-progress-text">
          <span>問題 {current} / {total}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="quiz-progress-bar-wrap">
          <div className="quiz-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <p className="quiz-meta">{quiz.category} · {quiz.difficulty}</p>

      <p className="quiz-question">{quiz.question}</p>

      <ul className="options">
        {quiz.options.map((option) => (
          <li key={option}>
            <button
              className={getButtonStyle(option)}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      {selected && quiz.explanation && (
        <p className="explanation">{quiz.explanation}</p>
      )}

      {selected && (
        <button className="btn-primary" onClick={handleNext}>
          {current === total ? '結果を見る →' : '次へ →'}
        </button>
      )}
    </div>
  )
}
