# The Wolf's Journey — Product Specification

## Overview

**The Wolf's Journey** is a mobile-first, Duolingo-style finance learning app built in React Native with Expo. Users learn finance through gamified lessons, guided by a wolf mascot that grows from a tiny cub into a full alpha wolf as they progress through biomes representing finance topics.

---

## Mascot & Theme

### The Wolf
- Starts as a **tiny wolf cub** and evolves through **7 visual growth stages** tied to unit completion
- Has idle animations between questions and on key events:
  - **Sniffing** — idle between questions
  - **Panting** — idle while waiting for input
  - **Howling** — plays on unit/lesson completion
- **Streak health**: Wolf looks energetic and healthy when streak is maintained; looks tired, droopy, and dull when streak is broken

### Wolf Growth Stages
| Stage | Name | Unlocked At |
|-------|------|-------------|
| 1 | Cub | Start |
| 2 | Pup | Unit 3 complete |
| 3 | Young Wolf | Unit 7 complete |
| 4 | Wolf | Unit 12 complete |
| 5 | Pack Leader | Unit 18 complete |
| 6 | Elder Wolf | Unit 24 complete |
| 7 | Alpha | All units complete |

---

## Biomes & Learning Path

The map is a **winding path** through biomes, each representing a finance topic cluster. Biomes unlock sequentially. Locked biomes appear desaturated/greyed out.

### Biome Map

| # | Biome | Topic | Color Palette |
|---|-------|-------|---------------|
| 1 | The Meadow | Finance Basics (terminology, time value of money, basic accounting) | Soft greens, yellows, light sky |
| 2 | The Forest | Financial Statements (income statement, balance sheet, cash flow statement) | Deep greens, browns, dappled light |
| 3 | The Mountains | Ratios & Connections (liquidity, profitability, leverage, how statements connect) | Greys, blues, snow-capped whites |
| 4 | The River | Cash Flow (operating/investing/financing, FCF, working capital) | Blues, teals, sandy banks |
| 5 | The Summit | Valuation (DCF, multiples, comps, precedent transactions) | Purples, golds, wide-sky panorama |
| 6 | The Tundra | Advanced Modeling (LBO, M&A, scenario analysis, sensitivity) | Icy blues, whites, dark skies |
| 7 | The Night Hunt | Expert (edge cases, complex structures, synthesis questions) | Deep navy, moonlit silvers, amber |

### Path Design
- The wolf is **visually positioned on the path** at the user's current unit
- Completed units show a **paw print** or filled icon
- Current unit shows the **wolf sitting/waiting**
- Future units show **locked icons** with a faint lock overlay

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native with Expo |
| Authentication | Firebase Authentication (email/password) |
| Database | Firebase Firestore |
| AI Grading | Anthropic Claude API |
| State Management | React Context + useReducer (or Zustand) |
| Animations | React Native Reanimated + Lottie |
| Navigation | Expo Router (file-based routing) |

### Firebase Firestore Schema

```
users/{userId}
  ├── email: string
  ├── displayName: string
  ├── createdAt: timestamp
  ├── xp: number
  ├── streak: number
  ├── lastActivityDate: timestamp
  ├── wolfStage: number (1–7)
  ├── currentUnit: number
  ├── completedUnits: number[]
  ├── unitStars: { [unitId]: 1|2|3 }
  └── placementTestComplete: boolean

lessons/{lessonId}
  ├── unitId: string
  ├── biomeId: string
  ├── level: number
  ├── questions: Question[]
  └── xpReward: number
```

---

## Screens

### 1. Onboarding / Auth Screen
- Clean full-screen design with wolf cub illustration
- Options: **Sign Up** or **Log In**
- Email/password form
- On successful auth:
  - New users → Placement Test
  - Returning users → Home/Map Screen
- Error states: invalid email, wrong password, network error
- Microcopy: "Begin your journey", "Welcome back, Wolf"

### 2. Placement Test Screen
- **10 questions** spanning all biomes/levels
- Questions increase in difficulty
- No finance knowledge assumed — first questions are extremely basic
- Progress bar at top (1 of 10, 2 of 10...)
- No hearts during placement — wrong answers just inform placement, no penalty
- On completion:
  - Algorithm determines starting unit based on score
  - Score 0–2 correct → Start at Unit 1 (Meadow)
  - Score 3–4 → Start at Unit 3
  - Score 5–6 → Start at Unit 7
  - Score 7–8 → Start at Unit 12
  - Score 9–10 → Start at Unit 18
- Show result screen: "You're a [Wolf Stage]! Starting in [Biome]"

### 3. Home / Map Screen
- Main hub of the app
- Full-screen scrollable map with the winding path
- Each biome visually distinct with its color palette
- Wolf positioned at current unit
- Tapping a completed unit → view stars/replay option
- Tapping the current unit → enter lesson
- Tapping a locked unit → "Keep going to unlock!"
- Bottom tab bar: Map | Profile
- Top: streak flame icon + count, XP total

### 4. Lesson Screen
- One question displayed at a time
- **Top**: Progress bar (question X of Y), hearts display (5 max)
- **Middle**: Question prompt, wolf idle animation in corner
- **Bottom**: Answer area (MCQ buttons or free-text input)
- On correct answer:
  - Green flash animation
  - XP +[amount] shown briefly
  - Wolf does a small happy bounce
  - "Nice work!" / "Correct!" microcopy
  - Auto-advance after 1s
- On wrong answer:
  - Red shake animation on answer
  - Heart count decreases by 1
  - Correct answer revealed with brief explanation
  - "Not quite — here's why..." microcopy
  - If hearts reach 0 → Session End modal (option to restart or quit)
- Free-text answers:
  - Submitted to Claude API for grading
  - Loading state shown while awaiting response
  - Correct/incorrect shown with Claude's explanation

### 5. Unit Complete Screen
- Full-screen celebration
- Wolf **howling animation** (Lottie)
- Confetti particle effect
- Stars awarded (1–3 based on hearts remaining):
  - 5 hearts remaining → 3 stars
  - 3–4 hearts → 2 stars
  - 1–2 hearts → 1 star
- XP earned shown prominently
- "Keep Climbing!" CTA button → back to map
- If wolf grew a stage: special evolution animation plays first

### 6. Profile Screen
- Wolf illustration at current growth stage
- **Stats displayed**:
  - Current streak (flame icon + days)
  - Total XP
  - Units completed / total units
  - Stars collected / total possible stars
  - Wolf stage name
- Streak status: healthy wolf if active, tired wolf if streak broken
- Recent activity or milestone badges (stretch goal)

---

## Gamification System

### XP
- +10 XP per correct answer
- +25 XP bonus for completing a lesson with all 5 hearts intact
- +10 XP bonus for completing with 3–4 hearts
- XP displayed on Unit Complete screen and briefly after each correct answer

### Hearts
- 5 hearts per session
- Lose 1 heart per wrong answer
- Session ends when hearts reach 0 (modal: restart or exit)
- Hearts reset at start of each new lesson session

### Streaks
- A streak day is earned by completing at least 1 lesson
- Streak resets if no lesson is completed within a 24-hour window from last activity
- Streak count shown on Home and Profile screens
- Wolf appearance reflects streak health:
  - Active streak → energetic, bright-eyed wolf
  - Broken streak → tired, desaturated wolf with droopy ears

### Stars
- Each lesson awards 1–3 stars based on hearts remaining at completion
- Stars shown on unit icons on the map
- Stars are permanent (best score kept if replaying)

### Wolf Evolution
- Wolf visually grows across 7 stages
- Evolution triggered by unit completion milestones
- Special animation plays when wolf evolves to next stage
- Wolf stage name shown on Profile

---

## Question System

### Question Types

**1. Multiple Choice (MCQ)**
- 4 answer options
- Used for early levels within each biome
- One clearly correct answer
- Distractors should be plausible but clearly wrong to someone who learned the material

**2. Free Text**
- Open-ended typed response
- Used in later levels within each biome
- Graded by Claude API
- Claude returns: `{ correct: boolean, explanation: string }`
- Explanation shown to user regardless of outcome

### Question Design Principles
- **Never assume prior knowledge** — terms are introduced before they are tested
- **Introduce, then reinforce** — first question about a term explains it in the prompt, then later questions test recall
- **Scaffolded difficulty** — within each unit, questions progress from recognition → recall → application
- **Plain language first** — avoid jargon in early questions; introduce proper terminology alongside plain explanations

### Question Bank Structure
```
Unit (e.g., "Income Statement Basics")
  └── Level 1: Recognition (MCQ only, definitions provided in question)
  └── Level 2: Recall (MCQ, no definitions given)
  └── Level 3: Application (MCQ + free text, scenario-based)
  └── Level 4: Synthesis (free text, connects to other concepts)
```

### Placement Test
- 10 questions drawn from across all biomes/levels
- Spans from extremely basic (Level 1 Meadow) to advanced (Level 3+ Tundra)
- Questions chosen to efficiently discriminate across knowledge levels
- No hearts, no XP — purely diagnostic
- Completes in a single linear flow

### Claude API Integration (Free Text Grading)
**Prompt template:**
```
You are grading a finance learning app response.

Question: {question}
Expected concepts: {expectedConcepts}
User's answer: {userAnswer}

Grade this answer as correct or incorrect. Be generous — if the user demonstrates the core concept, mark it correct even if phrasing is imperfect. Return JSON only:
{ "correct": true|false, "explanation": "1-2 sentence explanation shown to the user" }
```

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1B5E20` | Deep green — buttons, highlights |
| `primaryLight` | `#4CAF50` | Light green — correct flash |
| `error` | `#C62828` | Deep red — wrong answer shake |
| `errorLight` | `#EF5350` | Light red — heart icon |
| `background` | `#FFFFFF` | Screen backgrounds |
| `surface` | `#F5F5F5` | Card/input backgrounds |
| `text` | `#1A1A1A` | Primary text |
| `textSecondary` | `#757575` | Secondary/hint text |
| `xp` | `#F9A825` | XP gold color |
| `streak` | `#FF6F00` | Streak flame orange |

### Biome Color Palettes
| Biome | Primary | Accent |
|-------|---------|--------|
| Meadow | `#A5D6A7` | `#FFF59D` |
| Forest | `#2E7D32` | `#795548` |
| Mountains | `#78909C` | `#B0BEC5` |
| River | `#0288D1` | `#80DEEA` |
| Summit | `#6A1B9A` | `#FFD54F` |
| Tundra | `#B3E5FC` | `#E0E0E0` |
| Night Hunt | `#1A237E` | `#FFB300` |

### Typography
- **Heading font**: Rounded, friendly (e.g., Nunito or Poppins)
- **Body font**: Nunito Regular
- **Never use**: Serif or corporate fonts

### Microcopy Examples
| Context | Copy |
|---------|------|
| Correct answer | "Nice work!", "Exactly right!", "You've got this!" |
| Wrong answer | "Not quite — here's why:", "Almost! Let's look at that:", "Good try!" |
| Streak active | "You're on a roll, Wolf!" |
| Streak broken | "Time to get back on the trail..." |
| Unit complete | "Keep climbing!", "The summit awaits!" |
| Placement start | "Let's see where your journey begins..." |
| Lesson start | "Sharpen those claws!" |

### Animations
| Event | Animation |
|-------|-----------|
| Correct answer | Green flash overlay, wolf bounce |
| Wrong answer | Red shake on answer card, heart shake |
| Unit complete | Wolf howl (Lottie), confetti |
| Wolf evolution | Full-screen evolution sequence |
| Lesson start | Wolf walk-in from left |
| Map scroll | Parallax biome backgrounds |
| Heart lost | Heart "breaks" then fades |

---

## Navigation Structure

```
(app)
  ├── (auth)
  │   ├── index.tsx        — Landing / auth choice
  │   ├── login.tsx        — Log in form
  │   └── signup.tsx       — Sign up form
  ├── placement.tsx        — Placement test (shown once after signup)
  ├── (tabs)
  │   ├── index.tsx        — Home / Map Screen
  │   └── profile.tsx      — Profile Screen
  ├── lesson/[unitId].tsx  — Lesson Screen
  └── complete/[unitId].tsx — Unit Complete Screen
```

---

## Content Outline (Sample Questions per Biome)

### Biome 1: The Meadow — Finance Basics

**Unit 1: What is Finance?**
- L1: "Finance is the study of how people and businesses manage money over time. Which of the following is a finance question?" (MCQ)
- L2: "What does it mean to say money has 'time value'?" (MCQ)
- L3: "In your own words, why would you rather receive $100 today than $100 in a year?" (Free text)

**Unit 2: Revenue vs. Profit**
- L1: "Revenue is all the money a company earns from sales. Profit is what's left after expenses. A company earns $1M in sales and spends $800K. What is its profit?" (MCQ)
- L2: "Can a company have high revenue but low profit? Why?" (MCQ)
- L3: "A company reports $5M in revenue but loses money. Explain how this is possible." (Free text)

### Biome 2: The Forest — Financial Statements

**Unit 5: The Income Statement**
- L1: "The income statement shows a company's revenues and expenses over a period of time. Which of these would appear on an income statement?" (MCQ)
- L2: "EBITDA stands for Earnings Before Interest, Taxes, Depreciation and Amortization. Why might analysts use EBITDA instead of net income?" (MCQ)
- L3: "Walk me through what EBITDA measures and why it's useful." (Free text)

### Biome 5: The Summit — Valuation

**Unit 16: DCF Basics**
- L1: "A DCF (Discounted Cash Flow) model values a company based on its future cash flows, brought back to today's dollars. What does 'discount' mean in this context?" (MCQ)
- L2: "If interest rates rise, what happens to the present value of future cash flows in a DCF?" (MCQ)
- L3: "Explain in plain terms why a dollar of cash flow 5 years from now is worth less than a dollar today." (Free text)

---

## Error States & Edge Cases

| Scenario | Handling |
|----------|----------|
| No internet connection | Offline banner, disable lesson start |
| Claude API timeout | Show "Grading failed — try again" with retry button |
| Claude API marks ambiguous | Default to generous/correct if confidence low |
| User quits mid-lesson | Progress not saved, hearts not penalised |
| Firestore write failure | Retry with exponential backoff, notify user |
| Placement test interrupted | Restart from beginning on next open |
| All hearts lost | Modal: "Out of hearts! Restart lesson?" with option to exit |

---

## Future / Stretch Goals

- **Social**: Add friends, compare streaks and XP
- **Leaderboards**: Weekly XP leaderboard within friend groups
- **Badges**: Achievement system for milestones (first lesson, 7-day streak, etc.)
- **Offline mode**: Cache current unit for offline play
- **Notifications**: Daily reminder push notifications
- **Custom wolf skins**: Earn cosmetic wolf variations through milestones
- **Audio**: Optional sound effects and background ambient audio per biome
- **Timed challenge mode**: Bonus XP for speed
- **Glossary**: In-app finance term glossary built from completed units

---

*This spec is the source of truth for The Wolf's Journey. All implementation decisions should reference back to this document.*
