import { useEffect, useRef } from 'react'
import { aspects } from '../data/aspects'
import type { AnalysisResult } from '../services/analysis'

// Temporary live-results view. Phase 7 will replace this with the full design.
export function AnalysisResults({ result, onClear }: { result: AnalysisResult; onClear: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <section className="panel analysis-preview">
      <h2 ref={heading} tabIndex={-1}>Analysis completed</h2>
      <p className="analysis-preview-comment">{result.comment}</p>
      <p>{result.predictions.length} aspect {result.predictions.length === 1 ? 'category' : 'categories'} detected.</p>
      {result.predictions.length > 0 ? <ul>{result.predictions.map((prediction) => (
        <li key={prediction.aspect_code}>{prediction.aspect_code} — {aspects.find((aspect) => aspect.code === prediction.aspect_code)?.name}: {prediction.sentiment}</li>
      ))}</ul> : <p>No aspect categories detected.</p>}
      <button type="button" className="analysis-button secondary" onClick={onClear}>Analyze another comment</button>
    </section>
  )
}
