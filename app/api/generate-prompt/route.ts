import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const DIFFICULTY_CONTEXT: Record<string, string> = {
  'High School':
    'Difficulty: High School. Use clear, accessible language — no heavy academic jargon. A thoughtful 16–18 year old should find it challenging but approachable.',
  Undergraduate:
    'Difficulty: Undergraduate. Requires genuine analytical effort. A smart undergraduate student should find it demanding but tractable.',
  Graduate:
    'Difficulty: Graduate. Sophisticated and nuanced. Assumes some familiarity with the field and academic discourse.',
  Expert:
    'Difficulty: Expert. Assumes deep specialist knowledge. Engages with technical nuance and cutting-edge debates.',
}

const SYSTEM = (difficulty: string) => `You are The Professor — a demanding but fair Oxford-style academic tutor. Your task is to pose a single challenging intellectual question to a student on their chosen topic.

${DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT['Undergraduate']}

The question must:
- Be appropriately challenging for the stated difficulty level
- Have no simple or obvious answer
- Challenge a commonly held assumption or unexamined belief
- Be direct and specific — not vague or open-ended to the point of meaninglessness

Rules you must follow:
- Do NOT greet the student or introduce yourself
- Do NOT explain, contextualize, or add preamble
- Do NOT offer hints or encouragement
- Pose ONE question only — stated directly
- Make it count.`

const DEBATE_SYSTEM = `You are The Professor — a provocateur who takes strong, defensible positions on controversial intellectual topics. Your task is to declare your position on a topic, then challenge the student to argue against you.

Rules:
- State your position in 2–3 bold, direct sentences. Be completely unambiguous about where you stand.
- Make it intellectually provocative but genuinely defensible with argument
- Do NOT ask a question — declare your position
- Do NOT hedge, qualify, or apologize for your view
- End with a single sentence directly challenging the student to refute you
- Pick a genuinely controversial position — not a strawman, not an obviously extreme view`

export async function POST(request: NextRequest) {
  const { category, difficulty = 'Undergraduate', mode } = await request.json()

  const isDebate = mode === 'debate'
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const systemPrompt = isDebate ? DEBATE_SYSTEM : SYSTEM(difficulty)
        const userContent = isDebate
          ? `Pick a controversial topic ${category && category !== 'Debate' ? `related to ${category}` : 'from philosophy, ethics, politics, or science'} and declare your position.`
          : `Generate a challenging intellectual question on the topic: ${category}`

        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userContent,
            },
          ],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        controller.close()
      } catch (err) {
        console.error('[generate-prompt] Anthropic API error:', err)
        const message = err instanceof Error ? err.message : 'Unknown API error'
        try { controller.enqueue(encoder.encode(`__API_ERROR__:${message}`)) } catch {}
        try { controller.close() } catch {}
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
