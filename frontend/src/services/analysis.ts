import { aspects } from '../data/aspects'

export type Sentiment = 'positive' | 'neutral' | 'negative'
export type AspectPrediction = { aspect_code: string; sentiment: Sentiment }
export type AnalysisResult = {
  comment: string
  predictions: AspectPrediction[]
  model_version: string
  mode: 'live'
  truncation: { acd: boolean; acsa_aspects: string[] }
}

export const COMMENT_LIMIT = 1000

// Sample inputs only. Every sample is analyzed by the live backend.
export const sampleComments = [
  { language: 'English', comment: 'The new loading zone makes pedestrians safer, but parking fees are too expensive.' },
  { language: 'Tagalog', comment: 'Maganda ang programa, pero hindi maayos ang pagpapatupad nito.' },
  { language: 'Ilocano', comment: 'Nasayaat ti programa, ngem nangina unay ti bayad.' },
  { language: 'Code-switched', comment: 'Matagal ang pila sa terminal, pero mas maayos na ang traffic management ngayon. Sana mas mabilis din ang pagresponde sa reklamo.' },
] as const

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<AnalysisResult>
  if (typeof result.comment !== 'string' || typeof result.model_version !== 'string' || !result.model_version.trim() || result.mode !== 'live' || !Array.isArray(result.predictions)) return false
  const seen = new Set<string>()
  const validPredictions = result.predictions.every((prediction) => {
    if (!prediction || typeof prediction !== 'object' || !aspects.some((aspect) => aspect.code === prediction.aspect_code) || seen.has(prediction.aspect_code) || !['positive', 'neutral', 'negative'].includes(prediction.sentiment)) return false
    seen.add(prediction.aspect_code)
    return true
  })
  const truncation = result.truncation
  return validPredictions && !!truncation && typeof truncation.acd === 'boolean' &&
    Array.isArray(truncation.acsa_aspects) &&
    truncation.acsa_aspects.every((code) => typeof code === 'string' && seen.has(code)) &&
    new Set(truncation.acsa_aspects).size === truncation.acsa_aspects.length
}

export async function analyzeComment(comment: string, signal: AbortSignal): Promise<AnalysisResult> {
  let response: Response
  try {
    response = await fetch('/api/v1/analysis', {
      method: 'POST',
      cache: 'no-store',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ comment }),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('Could not connect to the analysis service. Please try again.')
  }
  if (response.status === 422) throw new Error('Enter a valid comment of 1–1,000 characters.')
  if (response.status === 503) throw new Error('The analysis model is currently unavailable. Please try again later.')
  if (!response.ok) throw new Error('Analysis could not be completed. Please try again.')
  let data: unknown
  try { data = await response.json() }
  catch { throw new Error('The analysis service returned an invalid response. Please try again.') }
  if (!isAnalysisResult(data) || data.comment !== comment) throw new Error('The analysis service returned an invalid result. Please try again.')
  return data
}
