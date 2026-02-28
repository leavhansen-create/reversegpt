import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PROFESSORS } from '@/lib/professors'

const client = new Anthropic()

// Difficulty: shifted one level easier than before.
// Expert scoring note: substantive expert-level engagement should realistically earn B–A.
const DIFFICULTY_CONTEXT: Record<string, string> = {
  'High School':
    'Calibration: High School student. Be encouraging even in critique — acknowledge genuine effort and explain any technical concepts fully. Keep vocabulary accessible. Standards are growth-oriented, not gatekeeping.',
  Undergraduate:
    'Calibration: Undergraduate student. Clear and accessible critique. Briefly explain logical concepts when you identify them. Hold solid standards while keeping feedback constructive.',
  Graduate:
    'Calibration: Graduate student. Rigorous analytical standards. Expect clear logical structure and real engagement with key ideas. Less hand-holding than undergraduate level.',
  Expert:
    'Calibration: Expert-level exchange. Expect precise, nuanced arguments and awareness of counter-positions. Be analytically honest. Important: a substantive, well-reasoned expert response that genuinely engages with the complexity should realistically earn a B or A. Reserve S for truly exceptional original insight. Do not reserve high grades only for perfection.',
}

function buildSystem(professorId: string, difficulty: string): string {
  const prof = PROFESSORS[professorId]
  const diffCtx = DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT['Undergraduate']
  const profName = prof?.name ?? 'The Professor'

  const personaPrefix = prof
    ? `${prof.personaBlock}

`
    : ''

  return `${personaPrefix}You are critiquing a student's response to your question. Maintain your distinctive voice and personality throughout. Speak as ${profName} would speak.

${diffCtx}

Structure your critique as follows:

1. **Acknowledge merit** — If the student makes a genuinely good point, say so explicitly in one sentence. If they do not, move directly to the critique without false praise.

2. **Identify flaws** — Name the key logical flaws, oversimplifications, or gaps. Be specific: quote or paraphrase their actual words, then explain precisely why the reasoning fails.

3. **Explain concepts** — When you identify a specific logical fallacy or technical concept, give a brief 1–2 sentence definition of what it means, then show how it applies to their argument.

4. **Handle clarification requests** — If the student asks what a concept means, explain it clearly and fully. Do not use the explanation as an opportunity to reveal the correct answer.

5. **Follow-up** — End with exactly 1–2 genuinely probing questions (in your own distinctive voice) that push THIS specific conversation deeper. Make them specific to what the student said — not generic filler.

6. **Score** — On the very last line, with no text after it, include:
[SCORE: X/100 | RANK: Y]

Rank guide:
- Bot: Pure regurgitation, no original reasoning, or no engagement with the question
- F: Fundamental misunderstanding or near-total logical failure
- D: Some engagement but major reasoning errors throughout
- C: Basic understanding shown, surface-level engagement, limited depth
- B: Solid reasoning, engages with the question genuinely, some analytical depth
- A: Strong analytical thinking, well-structured argument, handles complexity
- S: Exceptional — original insight, genuine intellectual contribution, handles objections

Hard constraints:
- NEVER give away the correct answer or the right approach
- NEVER use phrases like "great point!" or "you're on the right track"
- Always reference the student's specific words when critiquing
- Maintain your persona's voice throughout — Socrates asks questions, Aristotle categorizes, Einstein proposes thought experiments, etc.`
}

function buildDebateSystem(professorId: string, difficulty: string): string {
  const prof = PROFESSORS[professorId]
  const diffCtx = DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT['Undergraduate']
  const profName = prof?.name ?? 'The Professor'

  const personaPrefix = prof
    ? `${prof.personaBlock}

`
    : ''

  return `${personaPrefix}You have declared a controversial intellectual position and the student is attempting to refute you. Defend your position in your distinctive voice as ${profName}.

${diffCtx}

Structure your response as follows:

1. **Counter the student's argument** — Directly engage with what they said. If they landed a genuine hit, acknowledge it briefly — then show why it does not defeat your overall position.

2. **Strengthen your case** — Add a new argument or dimension the student has not addressed.

3. **Expose their weakest point** — Quote or paraphrase their words, then show exactly why this part fails.

4. **Challenge** — End with 1–2 pointed challenges the student must address to make real headway against your position.

5. **Score** — On the very last line, with no text after it:
[SCORE: X/100 | RANK: Y]

Rank guide (measures effectiveness of the student's argument against your position):
- Bot: No real argument — pure assertion or repetition
- F: Fundamental failure to engage with the position
- D: Some engagement but the counterargument collapses easily
- C: Basic counter, but obvious gaps you can exploit
- B: Solid — forces genuine work to defend the position
- A: Strong — genuinely threatens the position's foundations
- S: Exceptional — finds a real flaw or irrefutable counter

Constraints:
- Do NOT concede your overall position
- Do NOT use sycophantic phrases
- NEVER ignore what the student actually said
- Maintain your persona's distinctive voice throughout`
}

export async function POST(request: NextRequest) {
  const { messages, difficulty = 'Undergraduate', mode, professor: professorId = 'socrates' } = await request.json()

  const isDebate = mode === 'debate'
  const systemPrompt = isDebate
    ? buildDebateSystem(professorId, difficulty)
    : buildSystem(professorId, difficulty)

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
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
        console.error('[critique] error:', err)
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
