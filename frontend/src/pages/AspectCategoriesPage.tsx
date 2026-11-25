import { useState } from 'react'
import { IconifyIcon } from '../components/IconifyIcon'
import { PageHeading } from '../components/PageHeading'
import { aspects, sentimentLabels } from '../data/aspects'

export function AspectCategoriesPage() {
  const [selectedCode, setSelectedCode] = useState('A01')
  const selected = aspects.find((item) => item.code === selectedCode) ?? aspects[0]

  return (
    <>
      <PageHeading
        title="Understanding the analysis"
        description="A guide to the categories, model workflow, and research project."
      />
      <div className="aspects-layout">
        <section className="panel aspects-index" aria-labelledby="all-aspects-title">
          <div className="panel-heading">
            <h2 id="all-aspects-title">All 11 policy-related aspects</h2>
            <p>A comment may be assigned to more than one category.</p>
          </div>
          <div className="aspect-list" role="group" aria-label="Select an aspect category">
            {aspects.map((aspect) => (
              <button
                key={aspect.code}
                type="button"
                className={`aspect-option${selected.code === aspect.code ? ' selected' : ''}`}
                onClick={() => setSelectedCode(aspect.code)}
                aria-pressed={selected.code === aspect.code}
                aria-controls="aspect-detail"
              >
                <span className="aspect-mini-code">{aspect.code}</span>
                <span className="aspect-option-name">{aspect.name}</span>
                <IconifyIcon icon="lucide:chevron-right" size={16} className="aspect-option-arrow" />
              </button>
            ))}
          </div>
          <p className="index-note">Select any category to view its official taxonomy definition and illustrative example.</p>
        </section>

        <div className="aspects-right">
          <section className="panel selected-aspect-card" id="aspect-detail" aria-live="polite" aria-atomic="true">
            <div className="detail-eyebrow"><span className="large-code">{selected.code}</span><span>Aspect category</span></div>
            <h2>{selected.name}</h2>
            <p className="aspect-description">{selected.description}</p>
            <div className="example-box">
              <p className="example-heading">Example concern</p>
              {selected.example ? <blockquote>“{selected.example}”</blockquote> : (
                <p className="other-explanation">There is no fixed example for A11. It is reserved for meaningful policy-related concerns that do not fit A01–A10.</p>
              )}
            </div>
            <p className="tiny-note">Example text is illustrative; it is not a live model prediction.</p>
          </section>
          <section className="panel sentiment-card" aria-labelledby="sentiment-title">
            <h2 id="sentiment-title">What do the sentiment labels mean?</h2>
            <div className="sentiment-list">
              {sentimentLabels.map((item) => (
                <div className="sentiment-row" key={item.name}>
                  <span className={`sentiment-pill ${item.tone}`}>{item.name}</span>
                  <span>{item.definition}</span>
                </div>
              ))}
            </div>
            <p className="sentiment-note">Sentiment is classified <strong>for each detected aspect</strong>, not necessarily for the comment as a whole.</p>
          </section>
        </div>
      </div>

      <section className="explain-strip panel" aria-labelledby="three-level-title">
        <div className="strip-title">
          <IconifyIcon icon="lucide:layers" size={24}/>
          <div><h2 id="three-level-title">Policy topic, aspect, and sentiment are different</h2><p>These three pieces of information describe different things.</p></div>
        </div>
        <div className="three-concepts">
          <div><span className="concept-kicker">01 · Citizen-provided context</span><h3>Policy topic</h3><p>Which policy, initiative, or public issue the comment concerns. This field is optional and is not predicted by the sentiment classifier.</p></div>
          <div><span className="concept-kicker">02 · NLP detection</span><h3>Aspect category</h3><p>Which of the 11 policy-related dimensions is discussed. Several categories may be detected in one comment.</p></div>
          <div><span className="concept-kicker">03 · NLP classification</span><h3>Aspect-level sentiment</h3><p>Whether the comment expresses a Positive, Neutral, or Negative evaluation of each detected aspect.</p></div>
        </div>
      </section>
      <section className="panel multi-aspect-card" aria-labelledby="multi-aspect-heading">
        <div className="section-inline-title"><IconifyIcon icon="lucide:message-square-text" size={24}/><h2 id="multi-aspect-heading">One comment can express different opinions</h2></div>
        <p className="subtle-copy">Consider this hypothetical comment. It discusses both convenient access and safety, with different viewpoints.</p>
        <blockquote className="sample-quote">“Mahaba ang pila sa terminal, pero mas ligtas tumawid dahil sa bagong loading zone.”</blockquote>
        <div className="sample-result-grid">
          <div><span className="aspect-mini-code">A04</span><span>Accessibility and Convenience</span><span className="sentiment-pill negative">Negative</span></div>
          <div><span className="aspect-mini-code">A08</span><span>Public Safety and Security</span><span className="sentiment-pill positive">Positive</span></div>
        </div>
        <p className="tiny-note">Illustrative interpretation only; actual detected categories and sentiments depend on the deployed model.</p>
      </section>
    </>
  )
}
