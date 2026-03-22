import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const { category = 'S3', count = 3 } = await req.json()

  const prompt = `AWS Developer Associate (DVA) 試験対策のクイズを${count}問生成してください。
カテゴリ: ${category}

以下のJSON配列形式で返してください。他のテキストは一切含めないでください。

[
  {
    "question": "問題文",
    "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correct_answer": "正解の選択肢（optionsの中の1つと完全一致）",
    "explanation": "解説文（なぜその答えが正解か）",
    "category": "${category}",
    "difficulty": "easy" または "medium" または "hard"
  }
]`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Unexpected response type' }), { status: 500 })
  }

  const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const quizzes = JSON.parse(cleaned)

  const { data, error } = await supabase.from('quizzes').insert(quizzes).select()
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ quizzes: data }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
