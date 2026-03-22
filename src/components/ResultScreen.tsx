type Props = {
  correct: number
  total: number
  onRestart: () => void
  onStats: () => void
}

export function ResultScreen({ correct, total, onRestart, onStats }: Props) {
  const percentage = Math.round((correct / total) * 100)

  return (
    <div className="screen">
      <div className="result-card">
        <p className="result-label">クイズ完了</p>
        <p className="result-score">{percentage}%</p>
        <p className="result-detail">{total}問中 {correct}問正解</p>
      </div>
      <div className="result-actions">
        <button className="btn-primary" onClick={onRestart}>もう一度挑戦</button>
        <button onClick={onStats}>統計を見る</button>
      </div>
    </div>
  )
}
