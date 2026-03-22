const CATEGORIES = ['S3', 'Lambda', 'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'EC2', 'IAM']

type Props = {
  onStart: () => void
  onGenerate: (category: string) => void
  generating: boolean
}

export function StartScreen({ onStart, onGenerate, generating }: Props) {
  return (
    <div className="screen">
      <h1>AWS DVA クイズ</h1>
      <p>AWS Developer Associate 試験対策クイズです。</p>
      <button onClick={onStart}>既存の問題でスタート</button>
      <div className="divider">または</div>
      <p className="label">AIでカテゴリを選んで問題を生成</p>
      <ul className="category-list">
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <button
              onClick={() => onGenerate(cat)}
              disabled={generating}
            >
              {generating ? '生成中...' : cat}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
