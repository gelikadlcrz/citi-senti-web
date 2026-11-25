import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { IconifyIcon } from './IconifyIcon'
import { paths } from './Sidebar'
import { useAnalysisFlow } from './AnalysisFlowContext'
import type { AnalysisResult } from '../services/analysis'
import { formatAnalysisResults, getAspectName, sentimentLabels, sentimentOrder, summarizePredictions } from '../services/analysisResults'
import './AnalysisResults.css'

export function AnalysisResults({ result, onClear }: { result: AnalysisResult; onClear: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const navigate = useNavigate()
  const { setResultsVisible, setContributionDraft } = useAnalysisFlow()
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const counts = summarizePredictions(result)
  const total = result.predictions.length
  const predictions = [...result.predictions].sort((a, b) => a.aspect_code.localeCompare(b.aspect_code))

  useLayoutEffect(() => {
    setResultsVisible(true)
    heading.current?.focus()
    window.scrollTo(0, 0)
    return () => setResultsVisible(false)
  }, [setResultsVisible])

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(formatAnalysisResults(result))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  function contribute() {
    // Only the comment is handed off. No submission or database write happens here.
    setContributionDraft(result.comment)
    navigate(paths.contribute)
  }

  return (
    <div className="analysis-results-page">
      <section aria-labelledby="analysis-original-heading" className="analysis-original">
        <h2 id="analysis-original-heading">Your Comment</h2>
        <div className="analysis-original-comment">{result.comment}</div>
      </section>
      <section className="panel analysis-completed" aria-labelledby="analysis-completed-heading">
        <IconifyIcon icon="lucide:book-open-text" size={42} />
        <div>
          <h2 id="analysis-completed-heading" ref={heading} tabIndex={-1}>Analysis Completed</h2>
          <p>{total} aspect {total === 1 ? 'category' : 'categories'} detected · Sentiments are assigned per aspect</p>
        </div>
      </section>
      <section className="analysis-sentiment-grid" aria-label="Sentiment summary">
        {sentimentOrder.map((sentiment) => (
          <div key={sentiment} className={`panel analysis-sentiment-card ${sentiment}`}>
            <span className="analysis-sentiment-dot" aria-hidden="true" />
            <div>
              <span className="analysis-sentiment-title">{sentimentLabels[sentiment]}</span>
              <strong className="analysis-sentiment-number">{counts[sentiment]}</strong>
            </div>
          </div>
        ))}
      </section>
      <section className="panel analysis-detected" aria-labelledby="analysis-detected-heading">
        <h2 id="analysis-detected-heading">Detected Aspects &amp; Sentiments</h2>
        <p>One comment may contain several aspect-level classifications.</p>
        <div className="analysis-table-wrap">
          <table className="analysis-results-table">
            <thead><tr><th scope="col">Code</th><th scope="col">Aspect Category</th><th scope="col">Sentiment</th></tr></thead>
            <tbody>
              {predictions.map(({ aspect_code, sentiment }) => (
                <tr key={aspect_code}>
                  <td><span className="analysis-code-pill">{aspect_code}</span></td>
                  <td>{getAspectName(aspect_code)}</td>
                  <td><span className={`analysis-sentiment-pill ${sentiment}`}>{sentimentLabels[sentiment]}</span></td>
                </tr>
              ))}
              {!total && <tr><td colSpan={3} className="analysis-empty-result">No aspect categories detected. The model did not identify any of the supported aspects in this comment.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <div className="analysis-results-actions">
        <button className="analysis-button secondary" type="button" onClick={copyResults}><IconifyIcon icon="lucide:copy" size={20} />{copyStatus === 'copied' ? 'Copied' : 'Copy Results'}</button>
        <button className="analysis-button secondary" type="button" onClick={onClear}><IconifyIcon icon="lucide:refresh-cw" size={19} />Clear</button>
        <button className="analysis-button primary analysis-contribute-button" type="button" onClick={contribute}><IconifyIcon icon="lucide:send" size={18} />Submit Feedback</button>
      </div>
      {copyStatus === 'copied' && <p className="analysis-sr-only" role="status">Analysis results copied to clipboard.</p>}
      {copyStatus === 'failed' && <div className="analysis-copy-fallback"><p role="status">Clipboard access is unavailable. Select and copy the results below.</p><textarea readOnly aria-label="Results to copy" value={formatAnalysisResults(result)} onFocus={(event) => event.target.select()} /></div>}
    </div>
  )
}
