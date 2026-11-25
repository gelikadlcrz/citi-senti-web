import type { ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { IconifyIcon } from '../components/IconifyIcon'
import {
  DATE_RANGES,
  fetchFilterOptions,
  fetchInsights,
  type DateRange,
  type InsightFilters,
  type InsightsData,
  type Sentiment,
} from '../services/insights'

const SENTIMENTS: { value: Sentiment; label: string; color: string }[] = [
  { value: 'positive', label: 'Positive', color: '#155332' },
  { value: 'neutral', label: 'Neutral', color: '#B2954B' },
  { value: 'negative', label: 'Negative', color: '#823E46' },
]

const DEFAULT_RANGE: DateRange = '30d'
const formatNumber = (value: number) => value.toLocaleString('en-US')

/** Filters live in the URL (?topic=3&range=90d) so a filtered view can be shared or bookmarked. */
function useInsightFilters() {
  const [params, setParams] = useSearchParams()
  const range = params.get('range')
  const sentiment = params.get('sentiment')
  const filters: InsightFilters = {
    topicId: params.get('topic') ?? '',
    aspect: params.get('aspect') ?? '',
    sentiment: SENTIMENTS.some((s) => s.value === sentiment) ? (sentiment as Sentiment) : '',
    range: DATE_RANGES.some((r) => r.value === range) ? (range as DateRange) : DEFAULT_RANGE,
  }
  const setFilter = (key: 'topic' | 'aspect' | 'sentiment' | 'range', value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      const isDefault = !value || (key === 'range' && value === DEFAULT_RANGE)
      if (isDefault) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }
  return { filters, setFilter }
}

/** Whole-number percentages that always add up to 100 (largest remainder method). */
function toPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return counts.map(() => 0)
  const exact = counts.map((count) => (count / total) * 100)
  const rounded = exact.map(Math.floor)
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0)
  const byRemainder = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest)
  for (const { index } of byRemainder) {
    if (remaining <= 0) break
    rounded[index] += 1
    remaining -= 1
  }
  return rounded
}

export function PublicInsightsPage() {
  const { filters, setFilter } = useInsightFilters()
  const options = useQuery({ queryKey: ['insight-filters'], queryFn: fetchFilterOptions, staleTime: Infinity })
  const insights = useQuery({
    queryKey: ['insights', filters],
    queryFn: () => fetchInsights(filters),
    placeholderData: keepPreviousData,
  })
  const data = insights.data
  const isSuppressed = data?.suppressed === true
  const isEmpty = !isSuppressed && data?.summary.eligible_submissions === 0

  return (
    <div className="insights-page">
      <div className="explore-heading-copy insights-heading">
        <h1>Explore the collected feedback</h1>
        <p>Filter by topic, aspect, sentiment, or time period. Individual comments are not published.</p>
      </div>

      <section className="insights-filters panel" aria-label="Filters">
        <FilterSelect label="Policy Topic" value={filters.topicId} onChange={(value) => setFilter('topic', value)}>
          <option value="">All Topics</option>
          {options.data?.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Aspect" value={filters.aspect} onChange={(value) => setFilter('aspect', value)}>
          <option value="">All Aspects</option>
          {options.data?.aspects.map((aspect) => <option key={aspect.code} value={aspect.code}>{aspect.code} {aspect.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Sentiment" value={filters.sentiment} onChange={(value) => setFilter('sentiment', value)}>
          <option value="">All Sentiments</option>
          {SENTIMENTS.map((sentiment) => <option key={sentiment.value} value={sentiment.value}>{sentiment.label}</option>)}
        </FilterSelect>
        <FilterSelect label="Date Range" value={filters.range} onChange={(value) => setFilter('range', value)}>
          {DATE_RANGES.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
        </FilterSelect>
      </section>

      {insights.isError && !data ? (
        <section className="insights-message panel" role="alert">
          <span className="icon-frame"><IconifyIcon icon="lucide:badge-alert" size={26} /></span>
          <h2>Insights couldn’t load</h2>
          <p>The statistics service didn’t respond. Check that the backend is running, then try again.</p>
          <button type="button" className="external-button" onClick={() => insights.refetch()}>Try again</button>
        </section>
      ) : (
        <div className={`insights-results${insights.isFetching ? ' is-updating' : ''}`} aria-busy={insights.isFetching}>
          <SummaryCards data={isSuppressed ? undefined : data} />
          {isSuppressed ? (
            <section className="insights-message panel">
              <span className="icon-frame"><IconifyIcon icon="lucide:shield-check" size={26} /></span>
              <h2>Too few submissions to show</h2>
              <p>
                Fewer than {data?.min_group_size} approved submissions match these filters, so statistics are hidden
                to protect contributors’ privacy. Try a longer date range or a broader filter.
              </p>
            </section>
          ) : isEmpty ? (
            <section className="insights-message panel">
              <span className="icon-frame"><IconifyIcon icon="lucide:info" size={26} /></span>
              <h2>No feedback matches these filters</h2>
              <p>Try a longer date range, or set Policy Topic, Aspect, or Sentiment back to “All”.</p>
            </section>
          ) : (
            <div className="insights-charts">
              <SentimentCard data={data} />
              <TopAspectsCard data={data} />
            </div>
          )}
        </div>
      )}

      <aside className="insights-caution">
        <IconifyIcon icon="lucide:info" size={26} />
        <div>
          <h2>Interpret with care</h2>
          <p>These are voluntary-sample statistics, not a representative survey of Baguio City residents.</p>
        </div>
      </aside>
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  const id = `insights-filter-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="insights-filter">
      <label htmlFor={id}>{label}</label>
      <div className="insights-select">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
        <IconifyIcon icon="lucide:chevron-down" size={24} />
      </div>
    </div>
  )
}

function SummaryCards({ data }: { data?: InsightsData }) {
  const cards = [
    { icon: 'lucide:message-square-text', label: 'Eligible submissions', value: data?.summary.eligible_submissions },
    { icon: 'lucide:layers', label: 'Aspect assignments', value: data?.summary.aspect_assignments },
    { icon: 'lucide:book-open', label: 'Aspect categories', value: data?.summary.aspect_categories },
    { icon: 'lucide:globe', label: 'Language groups', value: data?.summary.language_groups },
  ] as const
  return (
    <section className="insights-stats" aria-label="Summary">
      {cards.map((card) => (
        <div key={card.label} className="insights-stat panel">
          <IconifyIcon icon={card.icon} size={30} />
          <div>
            <strong>{card.value === undefined ? '—' : formatNumber(card.value)}</strong>
            <span>{card.label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function SentimentCard({ data }: { data?: InsightsData }) {
  const counts = SENTIMENTS.map((s) => data?.sentiments.find((row) => row.sentiment === s.value)?.count ?? 0)
  const percentages = toPercentages(counts)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const lengths = counts.map((count) => (total ? (count / total) * circumference : 0))
  const segments = SENTIMENTS.map((sentiment, index) => ({
    ...sentiment,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  }))
  const description = SENTIMENTS.map((s, index) => `${s.label} ${percentages[index]}%`).join(', ')

  return (
    <section className="insights-card panel">
      <div className="panel-heading">
        <h2>Sentiment Distribution</h2>
        <p>Based on valid aspect-level predictions</p>
      </div>
      <div className="sentiment-chart">
        <svg className="sentiment-donut" viewBox="0 0 140 140" role="img" aria-label={data ? `Sentiment distribution: ${description}` : 'Loading sentiment distribution'}>
          <circle cx="70" cy="70" r={radius} className="sentiment-donut-track" />
          {segments.map((segment) => segment.length > 0 && (
            <circle
              key={segment.value}
              cx="70"
              cy="70"
              r={radius}
              stroke={segment.color}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              transform="rotate(-90 70 70)"
            />
          ))}
        </svg>
        <dl className="sentiment-legend">
          {SENTIMENTS.map((sentiment, index) => (
            <div key={sentiment.value}>
              <dt><span className="sentiment-swatch" style={{ background: sentiment.color }} />{sentiment.label}</dt>
              <dd title={data ? `${formatNumber(counts[index])} predictions` : undefined}>{data ? `${percentages[index]}%` : '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function TopAspectsCard({ data }: { data?: InsightsData }) {
  const aspects = data?.top_aspects ?? []
  const max = Math.max(1, ...aspects.map((aspect) => aspect.count))
  return (
    <section className="insights-card panel">
      <div className="panel-heading">
        <h2>Frequently Discussed Aspects</h2>
        <p>Ranked by detected category assignments</p>
      </div>
      <ol className="top-aspects">
        {aspects.map((aspect) => (
          <li key={aspect.code}>
            <span className="aspect-mini-code">{aspect.code}</span>
            <span className="top-aspect-name">{aspect.name}</span>
            <span className="top-aspect-bar" aria-hidden="true"><span style={{ width: `${(aspect.count / max) * 100}%` }} /></span>
            <span className="top-aspect-count">{formatNumber(aspect.count)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
