// Claude API is called server-side to avoid exposing the API key in the browser.
// TODO: Set up a lightweight backend endpoint (e.g. a Vercel serverless function)
//       that proxies requests to the Anthropic API.
//
// Expected endpoint: POST /api/grade
// Request body:  { question, expectedConcepts, userAnswer }
// Response body: { correct: boolean, explanation: string }

const GRADE_ENDPOINT = '/api/grade';

/**
 * Grade a free-text answer using Claude.
 *
 * @param {object} params
 * @param {string} params.question       - The question prompt shown to the user
 * @param {string[]} params.expectedConcepts - Key concepts the answer should cover
 * @param {string} params.userAnswer     - The user's typed answer
 * @returns {Promise<{ correct: boolean, explanation: string }>}
 */
export async function gradeAnswer({ question, expectedConcepts, userAnswer }) {
  const response = await fetch(GRADE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, expectedConcepts, userAnswer }),
  });

  if (!response.ok) {
    throw new Error(`Grading request failed: ${response.status}`);
  }

  const data = await response.json();
  return { correct: Boolean(data.correct), explanation: data.explanation ?? '' };
}

// ─── Grading prompt template (used in the backend) ────────────────────────────
//
// You are grading a finance learning app response.
//
// Question: {question}
// Key concepts expected: {expectedConcepts.join(', ')}
// User's answer: {userAnswer}
//
// Grade this answer as correct or incorrect.
// Be generous — if the user demonstrates the core concept, mark it correct
// even if phrasing is imperfect or terminology isn't exact.
// Ignore spelling mistakes.
//
// Return ONLY valid JSON, no other text:
// { "correct": true|false, "explanation": "1-2 sentences shown directly to the user" }
