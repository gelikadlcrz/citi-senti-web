import { Link } from 'react-router'
import { IconifyIcon } from '../components/IconifyIcon'
import { PageHeading } from '../components/PageHeading'
import { paths } from '../components/Sidebar'

const workflow = [
  { n: '01', title: 'Enter feedback', description: 'Write in English, Tagalog, Ilocano, or a combination of these languages.' },
  { n: '02', title: 'Preprocess', description: 'The deployed pipeline applies its documented text normalization and tokenization.' },
  { n: '03', title: 'Detect aspects', description: 'Fine-tuned Glot500-m identifies one or more policy-related categories from A01–A11.' },
  { n: '04', title: 'Classify sentiment', description: 'The fine-tuned classifier predicts Positive, Neutral, or Negative for each detected aspect where supported.' },
]

export function HowItWorksPage() {
  return (
    <>
      <PageHeading
        title="How CITI-Senti works"
        description="The website analyzes feedback; it does not generate replies or government recommendations."
      />
      <section className="panel workflow-panel" aria-labelledby="workflow-heading">
        <div className="section-heading-row workflow-heading">
          <h2 id="workflow-heading">From comment to aspect-level sentiment</h2>
          <span className="subtle-badge"><IconifyIcon icon="lucide:globe" size={17}/> 3 languages + code-switching</span>
          <p className="workflow-intro">Four steps help turn multilingual text into structured, interpretable predictions.</p>
        </div>
        <div className="workflow-steps">
          {workflow.map((step, i) => (
            <div className="workflow-step" key={step.n}>
              <div className="workflow-number">{step.n}</div>
              <div className="workflow-step-content"><h3>{step.title}</h3><p>{step.description}</p></div>
              {i < workflow.length - 1 && <IconifyIcon className="workflow-arrow" icon="lucide:arrow-right" size={24}/>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel walkthrough-panel" aria-labelledby="walkthrough-heading">
        <div className="section-heading-row"><div><h2 id="walkthrough-heading">What does an analysis look like?</h2><p>A single comment can discuss multiple aspects with different sentiments.</p></div><span className="subtle-badge">Illustrative example</span></div>
        <div className="walkthrough-content">
          <div className="example-comment"><div className="micro-label">EXAMPLE COMMENT</div><blockquote>“Mahaba ang pila sa terminal, pero mas ligtas tumawid dahil sa bagong loading zone.”</blockquote><p>This statement mentions a service inconvenience and a potential safety improvement.</p></div>
          <div className="example-outputs">
            <div className="micro-label">ILLUSTRATIVE ASPECT-LEVEL RESULTS</div>
            <div className="sample-aspect"><span className="aspect-mini-code">A04</span><span>Accessibility and Convenience</span><span className="sentiment-pill negative">Negative</span></div>
            <div className="sample-aspect"><span className="aspect-mini-code">A08</span><span>Public Safety and Security</span><span className="sentiment-pill positive">Positive</span></div>
            <p>Interpret each row separately rather than assigning one overall sentiment to the comment.</p>
          </div>
        </div>
      </section>

      <div className="lower-grid">
        <section className="panel info-panel" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading">Privacy and participation</h2>
          <div className="info-points">
            <div className="info-point"><span className="icon-frame"><IconifyIcon icon="lucide:send" size={25}/></span><div><h3>Temporary analysis</h3><p>Using Analyze Feedback does not automatically save your comment as a permanent contribution.</p></div></div>
            <div className="info-point"><span className="icon-frame"><IconifyIcon icon="lucide:shield-check" size={25}/></span><div><h3>Voluntary contribution</h3><p>A separate feedback submission requires an accessible privacy notice and explicit consent. Only eligible, approved submissions may contribute to Public Insights; individual comments are not publicly displayed.</p></div></div>
            <div className="info-point"><span className="icon-frame"><IconifyIcon icon="lucide:lock-keyhole" size={25}/></span><div><h3>Private management</h3><p>Keep the reference number and private access code provided on submission. They allow you to view, edit, or delete your contribution without an account. Lost codes cannot be recovered by the current system.</p></div></div>
            <div className="info-point"><span className="icon-frame"><IconifyIcon icon="lucide:circle-check" size={25}/></span><div><h3>Edits and deletion</h3><p>Changing comment text triggers reanalysis and renewed review. Deleting feedback removes it from active records and analytics, subject to disclosed backup or legal retention exceptions.</p></div></div>
          </div>
        </section>
        <section className="panel info-panel" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading">Understanding the model</h2>
          <p className="model-summary">CITI-Senti deploys a selected fine-tuned <strong>Glot500-m</strong> pipeline for multilingual aspect-category detection and aspect-level sentiment classification.</p>
          <div className="limitations-divider"/>
          <h3 className="caps-heading">Important limitations</h3>
          <ul className="limitations-list">
            <li>Predictions may be inaccurate when text is sarcastic, ambiguous, very brief, or code-switched.</li>
            <li>A comment with no detected aspects is <strong>not automatically Neutral</strong>. Processing failures are also not sentiments.</li>
            <li>The tool does not automatically identify ordinance numbers, extract separate opinion targets, or provide official government recommendations.</li>
            <li>Only the selected fine-tuned Glot500-m pipeline is used for live analysis; Logistic Regression and Linear SVM are research baselines, not user-selectable models.</li>
          </ul>
          <div className="note-panel"><IconifyIcon icon="lucide:info" size={20}/><p>The model's predictions are automated classifications, not verified government findings. Collected feedback cannot represent every Baguio City resident.</p></div>
          <Link className="text-link" to={paths.aspects}>Explore the 11 aspect categories <IconifyIcon icon="lucide:arrow-right" size={17}/></Link>
        </section>
      </div>
    </>
  )
}
