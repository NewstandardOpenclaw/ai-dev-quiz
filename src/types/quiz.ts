export type Quiz = {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string | null
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}
