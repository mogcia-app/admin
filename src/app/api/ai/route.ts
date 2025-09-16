import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// サーバーサイドでのAPIキー管理
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // NEXT_PUBLIC_プレフィックスなし
})

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    return NextResponse.json({
      message: completion.choices[0].message.content,
      usage: completion.usage
    })
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: 'AI機能でエラーが発生しました' },
      { status: 500 }
    )
  }
}
