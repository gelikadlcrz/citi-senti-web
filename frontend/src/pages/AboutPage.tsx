import { Link } from 'react-router'
import { IconifyIcon } from '../components/IconifyIcon'
import { PageHeading } from '../components/PageHeading'
import { paths } from '../components/Sidebar'

const goals = [
  'Develop a multilingual aspect-based sentiment analysis approach for citizen feedback about Baguio City governance.',
  'Fine-tune Glot500-m for multi-label detection of A01–A11 and sentiment classification of detected aspects.',
  'Evaluate the proposed approach against Logistic Regression and Linear Support Vector Machine research baselines.',
  'Develop a web platform for temporary analysis, voluntary contribution, and privacy-safe aggregated feedback insights.',
]
const methods = [
  { n: '01', title: 'Prepare research data', desc: 'Organize multilingual comments and annotated policy-related aspects and sentiment labels.' },
  { n: '02', title: 'Model and evaluate', desc: 'Fine-tune Glot500-m and compare it with Logistic Regression and Linear SVM using documented evaluation metrics.' },
  { n: '03', title: 'Implement the prototype', desc: 'Deploy the selected fine-tuned Glot500-m pipeline for temporary analysis and consent-based feedback contribution.' },
  { n: '04', title: 'Present cautious insights', desc: 'Use eligible, reviewed data to present aggregated aspects and sentiment distributions with limitations and sample sizes.' },
]

/** Names follow the research presentation; GitHub links are supplied by the project team. */
const researchTeam = [
  { name: 'Bernal, Mariella Lyshael Angeli C.', github: 'https://github.com/mariellangeli' },
  { name: 'Dela Cruz, Andrei Nicole J.', github: 'https://github.com/andwaei' },
  { name: 'Dela Cruz, Angelika Kyle G.', github: 'https://github.com/gelikadlcrz' },
  { name: 'Ferrer, Jhon Michael L.', github: 'https://github.com/mkaello' },
  { name: 'Galapate, Francie Gabrielle A.', github: 'https://github.com/franciegalapate' },
  { name: 'Mabalot, Rod Clarenz T.', github: 'https://github.com/Renzo404' },
  { name: 'Yarisantos, Nicole T.', github: 'https://github.com/YarisantosN02' },
]

export function AboutPage() {
  return (
    <>
      <PageHeading
        title="About CITI-Senti"
        description="The purpose, research objectives, and people behind the platform."
      />
      <section className="about-hero" aria-labelledby="about-hero-title">
        <div className="about-hero-content">
          <span className="hero-kicker"><IconifyIcon icon="lucide:graduation-cap" size={18}/> ACADEMIC RESEARCH PROJECT</span>
          <h2 id="about-hero-title">Making multilingual citizen feedback easier to understand.</h2>
          <p>CITI-Senti — Citizen Feedback Intelligence via Glot500-m for Trilingual Aspect-Based Sentiment Analysis in Baguio City — is a research-based platform that explores how multilingual feedback can reveal specific concerns about local policies, programs, and public services.</p>
          <div className="hero-tags"><span>English</span><span>Tagalog / Filipino</span><span>Ilocano</span><span>Code-switched comments</span></div>
        </div>
        <div className="hero-decoration" aria-hidden="true"><div className="pine-one"/><div className="pine-two"/><div className="pine-three"/></div>
      </section>

      <div className="about-two-col">
        <section className="panel about-card" aria-labelledby="background-heading">
          <div className="card-eyebrow"><IconifyIcon icon="lucide:message-square-text" size={20}/> RESEARCH BACKGROUND</div>
          <h2 id="background-heading">Why study citizen feedback?</h2>
          <p>Comments about government initiatives can express several concerns at once: accessibility, implementation, public safety, environmental effects, and more. A single overall sentiment label can obscure these differences.</p>
          <p>CITI-Senti uses <strong>aspect-based sentiment analysis (ABSA)</strong> to identify the relevant policy-related categories and classify the sentiment associated with each detected aspect.</p>
        </section>
        <section className="panel about-card" aria-labelledby="significance-heading">
          <div className="card-eyebrow"><IconifyIcon icon="lucide:globe" size={20}/> RESEARCH SIGNIFICANCE</div>
          <h2 id="significance-heading">Why analyze multiple languages?</h2>
          <p>Public discussions in Baguio City may be written in English, Tagalog, Ilocano, or a mixture. Supporting these forms allows a research tool to examine feedback without requiring users to translate their thoughts first.</p>
          <p>Aggregated aspect and sentiment patterns may help researchers and interested governing bodies <strong>examine</strong> collected concerns, but the platform does not establish representative citywide opinion or make government decisions.</p>
        </section>
      </div>

      <section className="panel objectives-card" aria-labelledby="objectives-heading">
        <div className="section-heading-row"><div><div className="card-eyebrow"><IconifyIcon icon="lucide:target" size={21}/> STUDY OBJECTIVES</div><h2 id="objectives-heading">What the project aims to accomplish</h2></div><span className="subtle-badge">Research + web prototype</span></div>
        <div className="objectives-grid">
          {goals.map((goal, i) => <div className="objective-item" key={goal}><span>{String(i + 1).padStart(2, '0')}</span><p>{goal}</p></div>)}
        </div>
      </section>

      <section className="panel methodology-card" aria-labelledby="methodology-heading">
        <div className="card-eyebrow"><IconifyIcon icon="lucide:flask-conical" size={20}/> METHODOLOGY OVERVIEW</div>
        <h2 id="methodology-heading">From research to a working platform</h2>
        <p className="subtle-copy">A high-level summary of the planned approach; model performance must be supported by the study's actual evaluation results.</p>
        <div className="methodology-steps">
          {methods.map((step) => <div className="method-step" key={step.n}><span className="method-number">{step.n}</span><div><h3>{step.title}</h3><p>{step.desc}</p></div></div>)}
        </div>
      </section>

      <div className="about-two-col about-last-row">
        <section className="panel about-card team-card" aria-labelledby="team-heading">
          <div className="team-content">
            <div className="card-eyebrow"><IconifyIcon icon="lucide:users" size={20}/> RESEARCH TEAM</div>
            <h2 id="team-heading">The people behind CITI-Senti</h2>
            <p className="team-intro">CITI-Senti is developed by seven researchers from Saint Louis University, as listed in the group's research presentation.</p>
            <ul className="team-members" aria-label="CITI-Senti research team members and GitHub profiles">
              {researchTeam.map(({ name, github }, index) => (
                <li key={github}>
                  <a
                    href={github}
                    className="team-member-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${name}'s GitHub profile (opens in a new tab)`}
                    title={`View ${name}'s GitHub profile`}
                  >
                    <span className="team-member-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <span className="team-member-name">{name}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="meta-box"><span>Academic affiliation</span><strong>Saint Louis University · Baguio City, Philippines</strong></div>
          </div>
        </section>
        <section className="panel about-card repo-card" aria-labelledby="repository-heading">
          <div className="repository-content">
            <div className="card-eyebrow"><IconifyIcon icon="lucide:github" size={20}/> OPEN DEVELOPMENT</div>
            <h2 id="repository-heading">Project repository</h2>
            <p>Built with React, TypeScript, FastAPI, PostgreSQL, and Glot500-m, the system identifies policy-related concerns and their corresponding sentiments to support academic research and data-driven civic insights.</p>
            <a href="https://github.com/gelikadlcrz/citi-senti-web" className="external-button" target="_blank" rel="noopener noreferrer"><IconifyIcon icon="lucide:github" size={19}/> View GitHub repository <IconifyIcon icon="lucide:external-link" size={16}/></a>
          </div>
        </section>
      </div>
      <section className="disclaimer" aria-labelledby="disclaimer-title"><IconifyIcon icon="lucide:info" size={23}/><div><h2 id="disclaimer-title">Academic research disclaimer</h2><p>CITI-Senti is not affiliated with the City Government of Baguio and is not an official government service. Automated predictions may be inaccurate. Collected submissions are voluntary and should not be interpreted as representative of all Baguio City residents. The system does not issue official responses or decisions.</p></div></section>
      <div className="bottom-action"><Link to={paths.workflow} className="text-link">Learn how the analysis works <IconifyIcon icon="lucide:arrow-right" size={18}/></Link></div>
    </>
  )
}
