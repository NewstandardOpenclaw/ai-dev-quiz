type Props = {
  onStart: () => void
}

export function StartScreen({ onStart }: Props) {
  return (
    <div className="screen">
      <h1>AWS DVA クイズ</h1>
      <p>AWS Developer Associate 試験対策クイズです。</p>
      <button onClick={onStart}>スタート</button>
    </div>
  )
}
