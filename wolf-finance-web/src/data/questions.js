// Questions are organised by unitId.
// Each question has:
//   id, unitId, level (1-4), type ('mcq' | 'free_text'),
//   prompt, options (MCQ only), correctIndex (MCQ only),
//   expectedConcepts (free text only), explanation

export const questions = [
  // ─── UNIT 1: What Is Finance? ───────────────────────────────────────
  {
    id: 'u1_l1_q1',
    unitId: 1,
    level: 1,
    type: 'mcq',
    prompt:
      'Finance is the study of how people and businesses manage money over time. Which of the following is a finance question?',
    options: [
      'What colour should we paint the office?',
      'Should we borrow money now to invest in new equipment?',
      'How many employees should we hire this year?',
      'What should our company logo look like?',
    ],
    correctIndex: 1,
    explanation:
      'Finance deals with decisions about money — borrowing, investing, and managing cash over time.',
  },
  {
    id: 'u1_l1_q2',
    unitId: 1,
    level: 1,
    type: 'mcq',
    prompt:
      'Which of these is an example of a financial asset?',
    options: [
      'A factory machine',
      'A company car',
      'A share of stock',
      'Office furniture',
    ],
    correctIndex: 2,
    explanation:
      'Stocks, bonds, and cash are financial assets. Physical things like machines and cars are called real assets.',
  },
  {
    id: 'u1_l2_q1',
    unitId: 1,
    level: 2,
    type: 'mcq',
    prompt:
      'What does it mean to say money has "time value"?',
    options: [
      'Money becomes physically worn over time',
      'A dollar today is worth more than a dollar in the future',
      'Prices always fall over time',
      'Money is only valuable during business hours',
    ],
    correctIndex: 1,
    explanation:
      'The time value of money means a dollar today can be invested to earn returns, making it worth more than a dollar received later.',
  },
  {
    id: 'u1_l3_q1',
    unitId: 1,
    level: 3,
    type: 'free_text',
    prompt:
      'In your own words, why would you rather receive $100 today than $100 in one year?',
    expectedConcepts: [
      'invest the money now',
      'earn interest or returns',
      'inflation reduces purchasing power',
      'time value of money',
      'opportunity cost',
    ],
    explanation:
      '$100 today can be invested immediately to grow — by next year it could be worth more than $100. Also, inflation means $100 buys less in the future.',
  },

  // ─── UNIT 2: Revenue vs. Profit ────────────────────────────────────
  {
    id: 'u2_l1_q1',
    unitId: 2,
    level: 1,
    type: 'mcq',
    prompt:
      'Revenue is all the money a company earns from selling its products or services. A company sells $500K of products this month. What is its revenue?',
    options: ['$0', '$500K', '$500K minus expenses', 'It depends on profit'],
    correctIndex: 1,
    explanation:
      'Revenue is simply total sales — it doesn\'t account for any costs. Profit is what remains after subtracting expenses.',
  },
  {
    id: 'u2_l1_q2',
    unitId: 2,
    level: 1,
    type: 'mcq',
    prompt:
      'Profit is what a company keeps after paying all its costs. A company earns $1M in revenue and spends $800K on costs. What is its profit?',
    options: ['$1M', '$800K', '$200K', '$1.8M'],
    correctIndex: 2,
    explanation: '$1,000,000 revenue − $800,000 costs = $200,000 profit.',
  },
  {
    id: 'u2_l2_q1',
    unitId: 2,
    level: 2,
    type: 'mcq',
    prompt:
      'Can a company have high revenue but still lose money?',
    options: [
      'No — high revenue always means profit',
      'Yes — if its costs are higher than its revenue',
      'Only if it pays too much tax',
      'No — revenue and profit are the same thing',
    ],
    correctIndex: 1,
    explanation:
      'Yes. A company can generate huge revenue but still lose money if its costs exceed that revenue. Many fast-growing startups do exactly this.',
  },
  {
    id: 'u2_l3_q1',
    unitId: 2,
    level: 3,
    type: 'free_text',
    prompt:
      'A company reports $5M in revenue but lost $1M last year. Explain how this is possible.',
    expectedConcepts: [
      'costs exceed revenue',
      'expenses higher than sales',
      'operating costs',
      'salaries',
      'cost of goods sold',
      'net loss',
    ],
    explanation:
      'If a company spends more than it earns — for example $6M in costs against $5M revenue — it records a net loss of $1M despite high revenue.',
  },

  // ─── UNIT 4: The Income Statement ──────────────────────────────────
  {
    id: 'u4_l1_q1',
    unitId: 4,
    level: 1,
    type: 'mcq',
    prompt:
      'The income statement shows a company\'s revenues and expenses over a period of time (like a quarter or a year). Which item would you find on an income statement?',
    options: [
      'Cash held in the bank',
      'Total debt owed to lenders',
      'Revenue from product sales',
      'Value of company buildings',
    ],
    correctIndex: 2,
    explanation:
      'Revenue appears on the income statement. Cash, debt, and buildings belong on the balance sheet.',
  },
  {
    id: 'u4_l2_q1',
    unitId: 4,
    level: 2,
    type: 'mcq',
    prompt:
      'EBITDA stands for Earnings Before Interest, Taxes, Depreciation and Amortization. Why do analysts often use EBITDA instead of net income?',
    options: [
      'Because EBITDA is always higher, making companies look better',
      'Because it strips out financing and accounting decisions to show core operating performance',
      'Because it includes the effect of debt',
      'Because it\'s required by accounting rules',
    ],
    correctIndex: 1,
    explanation:
      'EBITDA removes the effects of capital structure (interest), taxes, and non-cash accounting charges (D&A) to better compare operating performance across companies.',
  },
  {
    id: 'u4_l3_q1',
    unitId: 4,
    level: 3,
    type: 'free_text',
    prompt:
      'Walk me through what EBITDA measures and why it is useful for comparing companies.',
    expectedConcepts: [
      'earnings before interest taxes depreciation amortization',
      'operating performance',
      'removes capital structure',
      'compare across companies',
      'non-cash charges',
      'proxy for cash flow',
    ],
    explanation:
      'EBITDA measures operating profitability before financing costs and non-cash items, making it easier to compare companies regardless of how they\'re financed or their accounting policies.',
  },

  // ─── UNIT 15: DCF Valuation ─────────────────────────────────────────
  {
    id: 'u15_l1_q1',
    unitId: 15,
    level: 1,
    type: 'mcq',
    prompt:
      'A DCF (Discounted Cash Flow) model values a company based on its future cash flows, brought back to today\'s value. What does "discounting" future cash flows mean?',
    options: [
      'Reducing cash flows because the company performed poorly',
      'Converting future cash flows into their equivalent value today',
      'Ignoring cash flows beyond 5 years',
      'Applying a sales discount to products',
    ],
    correctIndex: 1,
    explanation:
      'Discounting converts future cash flows into present value — reflecting that a dollar in the future is worth less than a dollar today.',
  },
  {
    id: 'u15_l2_q1',
    unitId: 15,
    level: 2,
    type: 'mcq',
    prompt:
      'If interest rates rise, what happens to the present value of future cash flows in a DCF model?',
    options: [
      'Present value increases',
      'Present value stays the same',
      'Present value decreases',
      'It depends on the company\'s revenue',
    ],
    correctIndex: 2,
    explanation:
      'Higher interest rates mean a higher discount rate, which reduces the present value of future cash flows. This is why rising rates hurt growth stock valuations.',
  },
  {
    id: 'u15_l3_q1',
    unitId: 15,
    level: 3,
    type: 'free_text',
    prompt:
      'Explain in plain terms why a dollar of cash flow 5 years from now is worth less than a dollar today.',
    expectedConcepts: [
      'invest today',
      'earn returns',
      'opportunity cost',
      'inflation',
      'time value of money',
      'risk',
      'uncertainty',
    ],
    explanation:
      'A dollar today can be invested to grow over 5 years. Additionally, inflation erodes purchasing power and the future is uncertain — so future cash is inherently less valuable than cash in hand.',
  },
];

export function getQuestionsForUnit(unitId) {
  return questions.filter((q) => q.unitId === unitId);
}

export function getQuestionsByLevel(unitId, level) {
  return questions.filter((q) => q.unitId === unitId && q.level === level);
}

// Placement test: 10 questions spanning all difficulty levels
export const placementQuestions = [
  questions.find((q) => q.id === 'u1_l1_q1'), // Very basic
  questions.find((q) => q.id === 'u1_l1_q2'),
  questions.find((q) => q.id === 'u2_l1_q1'),
  questions.find((q) => q.id === 'u2_l2_q1'),
  questions.find((q) => q.id === 'u4_l1_q1'),
  questions.find((q) => q.id === 'u4_l2_q1'),
  questions.find((q) => q.id === 'u1_l3_q1'), // Free text starts
  questions.find((q) => q.id === 'u4_l3_q1'),
  questions.find((q) => q.id === 'u15_l2_q1'), // Advanced
  questions.find((q) => q.id === 'u15_l3_q1'),
].filter(Boolean);

export function getStartingUnitFromScore(correctCount) {
  if (correctCount <= 2) return 1;
  if (correctCount <= 4) return 3;
  if (correctCount <= 6) return 7;
  if (correctCount <= 8) return 12;
  return 16;
}
