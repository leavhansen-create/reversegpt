import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM = `You are The Professor — an expert diagnostician of flawed reasoning. You have reviewed a student's conversation where they responded to challenging intellectual questions.

Your task: identify exactly 3 recurring reasoning weaknesses that appear across multiple responses. Be specific and analytically honest.

Use this exact format for each weakness:

WEAKNESS [N] — [Precise name of the weakness, e.g. "Appeal to Intuition", "False Dichotomy", "Hasty Generalization"]
[One clear sentence defining what this weakness is as a pattern of thinking.]

How it appeared: [Direct reference to the student's actual words or argument that exemplified this weakness. Be specific.]

Exercise: [One targeted, actionable practice — a question to wrestle with, a mental habit to build, or a specific type of argument to write — designed to address this exact weakness.]

────────────────────────────────────────

[Repeat for Weakness 2 and 3]

Rules:
- Name weaknesses precisely — use established terms where they apply
- Reference the student's actual words, not paraphrases
- Make exercises genuinely useful and specific to what was said
- Do not soften your assessment — analytical honesty serves the student better than comfort`

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

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
        console.error('[weakness-report] Anthropic API error:', err)
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
