import { aspects } from '../data/aspects'
import type { AnalysisResult, Sentiment } from './analysis'

export const sentimentLabels: Record<Sentiment, string> = {
  positive: 'Positive', neutral: 'Neutral', negative: 'Negative',
}

export const sentimentOrder = ['positive', 'neutral', 'negative'] as const

export function summarizePredictions(result: AnalysisResult): Record<Sentiment, number> {
  const counts = { positive: 0, neutral: 0, negative: 0 }
  for (const prediction of result.predictions) counts[prediction.sentiment]++
  return counts
}

export function getAspectName(code: string): string {
  return aspects.find((aspect) => aspect.code === code)?.name ?? code
}

export function formatAnalysisResults(result: AnalysisResult): string {
  const counts = summarizePredictions(result)
  const rows = [...result.predictions].sort((a, b) => a.aspect_code.localeCompare(b.aspect_code))
    .map(({ aspect_code, sentiment }) => `${aspect_code} — ${getAspectName(aspect_code)}: ${sentimentLabels[sentiment]}`)
  return [
    'CITI-Senti — Analysis Results', '', 'Your Comment:', result.comment, '',
    `Detected aspects: ${result.predictions.length}`,
    `Positive: ${counts.positive} | Neutral: ${counts.neutral} | Negative: ${counts.negative}`, '',
    ...(rows.length ? rows : ['No aspect categories detected.']), '',
    `Model: ${result.model_version}`, 'Model predictions, not verified findings.',
  ].join('\n')
}
