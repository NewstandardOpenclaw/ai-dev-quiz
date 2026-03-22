type Props = {
  correct: number
  total: number
  onRestart: () => void
}

export function ResultScreen({ correct, total, onRestart }: Props) {
  const percentage = Math.round((correct / total) * 100)

  return (
    <div className="screen">
      <h1>結果</h1>
      <p className="score">{correct} / {total} 正解</p>
      <p className="percentage">{percentage}%</p>
      <button onClick={onRestart}>もう一度</button>
    </div>
  )
}
