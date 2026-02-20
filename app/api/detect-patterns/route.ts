import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM = `You are an expert in critical thinking and argumentation analysis.

You will receive a tutoring conversation. Identify the recurring reasoning patterns or habits of thought visible in the STUDENT's responses — tendencies that appear across multiple responses, both positive and negative.

Return ONLY a valid JSON object in this exact format, with no additional text before or after:
{"patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]}

Rules:
- Maximum 5 patterns
- Each pattern must be 3–6 words (e.g. "Appeals to intuition", "Avoids counterarguments", "Overgeneralises from examples", "Strong use of analogy")
- Include both positive and negative patterns where warranted
- Only include patterns clearly evident from the conversation
- If only 1 student exchange exists, return 1–2 patterns maximum
- Return ONLY the JSON object — no preamble, no explanation, nothing else`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM,
      messages,
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Extract JSON object from response
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ patterns: [] })

    const parsed = JSON.parse(match[0])
    const patterns = Array.isArray(parsed.patterns)
      ? (parsed.patterns as unknown[])
          .filter((p): p is string => typeof p === 'string')
          .slice(0, 5)
      : []

    return NextResponse.json({ patterns })
  } catch (err) {
    console.error('[detect-patterns] error:', err)
    return NextResponse.json({ patterns: [] })
  }
}
