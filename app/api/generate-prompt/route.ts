import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PROFESSORS } from '@/lib/professors'

const client = new Anthropic()

// Difficulty: shifted one level easier than before
const DIFFICULTY_CONTEXT: Record<string, string> = {
  'High School':
    'Difficulty: High School. Very accessible and conversational — no academic jargon at all. A curious 14–16 year old should find the question engaging and tractable. Keep it grounded and clear.',
  Undergraduate:
    'Difficulty: Undergraduate. Clear language, no heavy jargon. A motivated 16–18 year old or first-year student should find this genuinely challenging but approachable.',
  Graduate:
    'Difficulty: Graduate. Requires solid analytical effort. A strong undergraduate with domain engagement should find this demanding but tractable.',
  Expert:
    'Difficulty: Expert. Sophisticated and nuanced. Assumes meaningful familiarity with the field. A graduate student or specialist should find this genuinely hard.',
}

function buildSystem(professorId: string, difficulty: string): string {
  const prof = PROFESSORS[professorId]
  const diffCtx = DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT['Undergraduate']

  if (!prof) {
    // Fallback generic
    return `You are a demanding intellectual tutor. Pose a single challenging question on the given topic.

${diffCtx}

The question must:
- Be appropriately challenging for the stated difficulty level
- Have no simple or obvious answer
- Challenge a commonly held assumption

Rules:
- Do NOT greet the student or introduce yourself
- Do NOT explain, contextualize, or add preamble
- Pose ONE question only — stated directly`
  }

  return `${prof.personaBlock}

${diffCtx}

Your task: pose a single challenging intellectual question to this student on the topic they have chosen. The question must fit BOTH your character and the difficulty level stated above.

The question must:
- Reflect your distinctive voice, style, and intellectual preoccupations as described above
- Have no simple or obvious answer
- Challenge a commonly held assumption or unexamined belief
- Be specific and direct — not vague or generic

Rules you must follow:
- Do NOT greet the student or introduce yourself
- Do NOT explain, contextualize, or add preamble
- Do NOT offer hints or encouragement
- Pose ONE question only — in YOUR distinctive voice
- Make it count`
}

function buildDebateSystem(professorId: string): string {
  const prof = PROFESSORS[professorId]

  const personaPrefix = prof
    ? `${prof.personaBlock}

`
    : ''

  return `${personaPrefix}Your task: declare a controversial intellectual position and challenge the student to argue against you. Speak in your distinctive voice throughout.

Rules:
- State your position in 2–3 bold, direct sentences. Be completely unambiguous about where you stand.
- Make it intellectually provocative but genuinely defensible
- Do NOT ask a question — declare your position
- Do NOT hedge, qualify, or apologize for your view
- End with a single sentence directly challenging the student to refute you
- Pick a genuinely controversial position — not a strawman`
}

export async function POST(request: NextRequest) {
  const { category, difficulty = 'Undergraduate', mode, professor: professorId = 'socrates' } = await request.json()

  const isDebate = mode === 'debate'
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const systemPrompt = isDebate
          ? buildDebateSystem(professorId)
          : buildSystem(professorId, difficulty)

        const userContent = isDebate
          ? `Pick a controversial topic ${category && category !== 'Debate' ? `related to ${category}` : 'from philosophy, ethics, politics, or science'} and declare your position.`
          : `Generate a challenging intellectual question on the topic: ${category}`

        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 450,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
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
        console.error('[generate-prompt] error:', err)
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
