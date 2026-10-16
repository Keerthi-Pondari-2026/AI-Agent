import type { DemoResults } from '../types/interview'
import type { InterviewQuestion } from '../types/interview'

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Heuristic scoring until a Gemini backend evaluates answers.
 * Stored in Supabase as real rows with is_illustrative = true.
 */
export function generateHeuristicResults(
  questions: InterviewQuestion[],
  answers: Record<string, string>,
): DemoResults {
  const perQuestion: number[] = questions.map((q) => {
    const text = answers[q.id] ?? ''
    const words = wordCount(text)
    if (words === 0) return 0
    if (words < 30) return 55
    if (words < 80) return 72
    if (words < 150) return 82
    return 88
  })

  const answered = perQuestion.filter((s) => s > 0)
  const overall =
    answered.length === 0
      ? 0
      : Math.round(answered.reduce((a, b) => a + b, 0) / answered.length)

  const communication = overall
  const technical =
    answered.length === 0
      ? 0
      : Math.round(
          perQuestion.reduce((a, b) => a + b, 0) / Math.max(perQuestion.length, 1),
        )

  return {
    overallScore: overall,
    categories: [
      { label: 'Communication', score: Math.min(100, communication + 4) },
      { label: 'Technical depth', score: technical },
      { label: 'Structure & clarity', score: Math.min(100, overall + 2) },
      { label: 'Problem solving', score: Math.max(0, overall - 3) },
    ],
    strengths: overall >= 70
      ? [
          'You provided substantive answers for most questions',
          'Responses show willingness to explain your reasoning',
        ]
      : [
          'You completed the session and captured your initial thoughts',
          'Good foundation to refine answers with more detail',
        ],
    improvements:
      answered.length < questions.length
        ? [
            'Answer every question — skipped prompts lower your practice value',
            'Aim for at least 80–120 words per technical answer',
          ]
        : [
            'Add metrics and concrete outcomes to strengthen impact',
            'Close each answer with a brief summary of your main point',
          ],
    recommendations: [
      'Re-run this interview after reviewing your stored answers in Supabase',
      'When Gemini is connected, scores will reflect AI evaluation instead of heuristics',
    ],
  }
}
