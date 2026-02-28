import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PROFESSORS } from '@/lib/professors'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { messages, professor: professorId = 'socrates' } = await request.json()

  const prof = PROFESSORS[professorId]
  const profName = prof?.name ?? 'The Professor'

  const personaPrefix = prof
    ? `${prof.personaBlock}

`
    : ''

  const SYSTEM = `${personaPrefix}You have just completed a tutoring session with a student. Speaking as ${profName} — in your distinctive voice — identify exactly 3 recurring reasoning weaknesses that appear across multiple of the student's responses.

Use this exact format for each weakness:

WEAKNESS [N] — [Precise name of the weakness, e.g. "Appeal to Intuition", "False Dichotomy", "Hasty Generalization"]
[One clear sentence defining what this weakness is as a pattern of thinking.]

How it appeared: [Direct reference to the student's actual words or argument that exemplified this weakness. Be specific.]

Exercise: [One targeted, actionable practice — a question to wrestle with, a mental habit to build, or a specific type of argument to write — designed to address this exact weakness. Frame it in your own voice.]

────────────────────────────────────────

[Repeat for Weakness 2 and 3]

Rules:
- Name weaknesses precisely — use established terms where they apply
- Reference the student's actual words, not vague paraphrases
- Make exercises genuinely useful and specific to what was said
- Speak in your character's voice throughout
- Do not soften your assessment`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM,
          messages,
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
        console.error('[weakness-report] error:', err)
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
