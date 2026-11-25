/**
 * Public Insights API (FastAPI: backend/app/routers/insights.py).
 * Only aggregated counts are returned; no individual comments.
 */
export type Sentiment = "positive" | "neutral" | "negative";
export type DateRange = "7d" | "30d" | "90d" | "12m" | "all";

export type InsightFilters = {
  topicId: string;
  aspect: string;
  sentiment: "" | Sentiment;
  range: DateRange;
};

export type FilterOptions = {
  topics: { id: number; name: string }[];
  aspects: { code: string; name: string }[];
};

export type InsightsData = {
  /** True when fewer than `min_group_size` submissions match; counts are withheld for privacy. */
  suppressed: boolean;
  min_group_size: number;
  summary: {
    eligible_submissions: number;
    aspect_assignments: number;
    aspect_categories: number;
    language_groups: number;
  };
  sentiments: { sentiment: Sentiment; count: number }[];
  top_aspects: { code: string; name: string; count: number }[];
  generated_at: string;
};

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return getJson("/api/v1/insights/filters");
}

export function fetchInsights(filters: InsightFilters): Promise<InsightsData> {
  const params = new URLSearchParams({ range: filters.range });
  if (filters.topicId) params.set("topic_id", filters.topicId);
  if (filters.aspect) params.set("aspect", filters.aspect);
  if (filters.sentiment) params.set("sentiment", filters.sentiment);
  return getJson(`/api/v1/insights?${params}`);
}
