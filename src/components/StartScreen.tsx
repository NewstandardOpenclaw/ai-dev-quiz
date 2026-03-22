import { useState } from 'react'

const CATEGORIES = ['すべて', 'S3', 'Lambda', 'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'EC2', 'IAM']
const DIFFICULTIES = ['すべて', 'easy', 'medium', 'hard'] as const

export type FilterOptions = {
  category: string
  difficulty: string
  shuffle: boolean
}

type Props = {
  onStart: (filters: FilterOptions) => void
  onGenerate: (category: string) => void
  generating: boolean
  onStats: () => void
}

export function StartScreen({ onStart, onGenerate, generating, onStats }: Props) {
  const [category, setCategory] = useState('すべて')
  const [difficulty, setDifficulty] = useState('すべて')
  const [shuffle, setShuffle] = useState(false)

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>AWS DVA クイズ</h1>
        <p>AWS Developer Associate 試験対策</p>
      </div>

      <div className="filter-section">
        <p className="filter-label">カテゴリ</p>
        <div className="filter-buttons">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={category === cat ? 'active' : ''}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="filter-label">難易度</p>
        <div className="filter-buttons">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={difficulty === d ? 'active' : ''}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="shuffle-label">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
          />
          シャッフル
        </label>
      </div>

      <button className="btn-primary" onClick={() => onStart({ category, difficulty, shuffle })}>
        既存の問題でスタート
      </button>
      <button onClick={onStats}>統計を見る</button>

      <div className="divider">AIで問題を生成</div>

      <ul className="category-list">
        {CATEGORIES.filter((c) => c !== 'すべて').map((cat) => (
          <li key={cat}>
            <button onClick={() => onGenerate(cat)} disabled={generating}>
              {generating ? '生成中...' : cat}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
