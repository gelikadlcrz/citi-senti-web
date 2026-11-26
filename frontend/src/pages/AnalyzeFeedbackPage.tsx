import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { IconifyIcon } from '../components/IconifyIcon'
import { analyzeComment, COMMENT_LIMIT, sampleComments } from '../services/analysis'
import type { AnalysisResult } from '../services/analysis'
import { AnalysisResults } from '../components/AnalysisResults'
import './AnalyzeFeedbackPage.css'

export function AnalyzeFeedbackPage() {
  const [comment, setComment] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [samplesOpen, setSamplesOpen] = useState(false)
  const request = useRef<AbortController | null>(null)
  const focusAfterClear = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sampleControl = useRef<HTMLDivElement>(null)
  const sampleButton = useRef<HTMLButtonElement>(null)
  const count = Array.from(comment).length

  useEffect(() => () => { request.current?.abort(); request.current = null }, [])
  useEffect(() => {
    if (!samplesOpen) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !sampleControl.current?.contains(event.target)) setSamplesOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [samplesOpen])

  useEffect(() => {
    if (!result && focusAfterClear.current) {
      focusAfterClear.current = false
      inputRef.current?.focus()
    }
  }, [result])

  function clear() {
    if (result) focusAfterClear.current = true
    setComment('')
    setResult(null)
    setError('')
    setSamplesOpen(false)
    inputRef.current?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.current) return
    const text = comment.trim()
    if (!text || count > COMMENT_LIMIT) {
      setError('Enter a comment containing 1–1,000 characters.')
      inputRef.current?.focus()
      return
    }
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    setSamplesOpen(false)
    try {
      const response = await analyzeComment(text, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Analysis failed. Please try again.')
    } finally {
      if (request.current === controller) {
        request.current = null
        setBusy(false)
      }
    }
  }

  if (result) return <AnalysisResults result={result} onClear={clear} />

  return (
    <div className="analysis-input-page">
      <div className="analysis-intro">
        <h1>What would you like to analyze?</h1>
        <p>Understand the policy-related issues and sentiments in your feedback.<br />English, Tagalog, Ilocano, and code-switched comments are welcome.</p>
      </div>
      <form className="panel analysis-composer" onSubmit={submit} aria-busy={busy}>
        <label className="analysis-sr-only" htmlFor="citizen-comment">Citizen feedback</label>
        <textarea
          id="citizen-comment"
          ref={inputRef}
          value={comment}
          onChange={(event) => {
            setComment(Array.from(event.target.value).slice(0, COMMENT_LIMIT).join(''))
            setError('')
          }}
          disabled={busy}
          placeholder="Enter a comment about a Baguio City policy, program, or service..."
          aria-describedby="analysis-count"
        />
        <div className="analysis-composer-actions">
          <div className="analysis-sample-control" ref={sampleControl} onKeyDown={(event) => {
            if (event.key === 'Escape') { setSamplesOpen(false); sampleButton.current?.focus() }
          }}>
            <button ref={sampleButton} type="button" className="analysis-sample-button" aria-expanded={samplesOpen} aria-controls="analysis-samples" disabled={busy} onClick={() => setSamplesOpen((open) => !open)}>
              <IconifyIcon icon="lucide:shuffle" size={23} />Try a sample<IconifyIcon icon="lucide:chevron-down" size={18} />
            </button>
            <div id="analysis-samples" className="analysis-samples" hidden={!samplesOpen}>
              {sampleComments.map((sample) => <button type="button" key={sample.language} onClick={() => {
                setComment(sample.comment); setError(''); setSamplesOpen(false); inputRef.current?.focus()
              }}><strong>{sample.language}</strong><span>{sample.comment}</span></button>)}
            </div>
          </div>
          <span id="analysis-count" className="analysis-count">{count.toLocaleString('en-US')} / 1,000</span>
          <button type="button" className="analysis-button secondary" onClick={clear} disabled={busy || !comment}>Clear</button>
          <button type="submit" className="analysis-button primary" disabled={busy || !comment.trim()}>
            {busy ? 'Analyzing…' : 'Analyze'}
            {busy ? <span className="analysis-spinner" aria-hidden="true" /> : <IconifyIcon icon="lucide:arrow-right" size={21} />}
          </button>
        </div>
        {error && <p className="analysis-error" role="alert">{error}</p>}
        <p className={busy ? 'analysis-processing-note' : 'analysis-sr-only'} role="status">{busy ? 'Analyzing your comment. The first request or sequential model loading may take longer. Please keep this page open.' : ''}</p>
      </form>
      <p className="analysis-privacy"><IconifyIcon icon="lucide:info" size={21} />Analysis is temporary. Comments are not added to Public Insights unless you contribute them.</p>
    </div>
  )
}
