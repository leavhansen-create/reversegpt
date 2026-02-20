import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM = `You are The Professor — an incisive and analytically honest assessor of critical thinking and argumentation. You have just completed a session with a student.

Provide a comprehensive final assessment using EXACTLY this structure:

OVERALL GRADE: [single letter — Bot, F, D, C, B, A, or S]

STRENGTHS:
1. [Specific strength this student demonstrated — reference their actual words or arguments]
2. [Specific strength]
3. [Specific strength]

WEAKNESSES:
1. [Specific weakness — concrete and tied to what this student actually did]
2. [Specific weakness]
3. [Specific weakness]

PATTERNS DETECTED:
- [Recurring reasoning pattern observed across the session]
- [Pattern]
- [Pattern]

STUDY RECOMMENDATION:
[2–3 sentences. Personalised to this student's demonstrated gaps. Name specific concepts, thinkers, works, or practices they should engage with. Be direct — not generic advice like "think more carefully".]

Grade guide:
- Bot: No original reasoning — pure regurgitation or refusal to engage
- F: Fundamental logical failures throughout
- D: Some engagement, but major reasoning errors dominate
- C: Basic understanding shown, surface-level engagement, limited depth
- B: Solid reasoning, genuine engagement with the question
- A: Strong analytical thinking, handles complexity well
- S: Exceptional — original insight, genuine intellectual contribution

Rules:
- Be analytically honest — do not soften assessments to spare feelings
- Reference the student's specific arguments and words
- The study recommendation must be genuinely personalised to what this student got wrong`

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
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
        console.error('[final-assessment] error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
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
