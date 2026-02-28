# ReverseGPT Project Memory

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS, `@anthropic-ai/sdk`
- All API routes stream via `ReadableStream` + `client.messages.stream()`

## Key Files
- `lib/professors.ts` — central professor definitions (personas, avatar colors, personas for prompts)
- `lib/storage.ts` — localStorage session persistence (`SavedSession`, `SavedMessage`)
- `app/chat/page.tsx` — main chat interface (professor state, all API calls, avatar rendering)
- `app/page.tsx` — home page with dashboard (Your Progress + Past Sessions)
- `app/api/generate-prompt/route.ts` — initial question generation
- `app/api/critique/route.ts` — response critique + scoring
- `app/api/weakness-report/route.ts` — 3-weakness analysis
- `app/api/final-assessment/route.ts` — comprehensive session assessment
- `app/api/detect-patterns/route.ts` — pattern tag detection (background, non-critical)

## Professor System
- `TOPIC_PROFESSORS`: maps category display name → professor ID
- `SURPRISE_PROFESSOR_IDS`: pool of random professors for Surprise Me / Debate / Custom
- All API routes accept `professor: string` in request body → inject persona into system prompt
- Avatar uses inline CSS styles (hex values), NOT Tailwind classes (purging issue)
- `ProfessorAvatar` component: circular div with initials, professor-specific colors

## API Patterns
- All routes accept: `messages`, `difficulty`, `professor` (+ `mode` for generate/critique)
- Errors prefixed with `__API_ERROR__:` in the stream
- Scores embedded in critique as `[SCORE: X/100 | RANK: Y]` on the last line
- `parseAndStripScore()` strips the score tag from displayed content

## Difficulty Calibration (current — shifted easier)
- High School: very accessible, no jargon, 14-16 year old
- Undergraduate: 16-18 year old / first year, clear language
- Graduate: solid undergrad level, rigorous
- Expert: graduate/specialist level, substantive engagement earns B-A (not just perfection)

## Storage
- Sessions saved to `localStorage` key `reversegpt_sessions`
- Save triggered on Back button click and `beforeunload`
- Minimum 2 user exchanges required to save
