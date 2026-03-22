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

  return (
    <div className="screen">
      <p className="progress">{current} / {total}</p>
      <p className="category">{quiz.category} · {quiz.difficulty}</p>
      <h2>{quiz.question}</h2>
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
        <button onClick={handleNext}>
          {current === total ? '結果を見る' : '次へ'}
        </button>
      )}
    </div>
  )
}
