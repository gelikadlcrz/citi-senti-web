import { createContext, useContext } from 'react'

type AnalysisFlow = {
  setResultsVisible: (visible: boolean) => void
  contributionDraft: string | null
  setContributionDraft: (comment: string | null) => void
}

export const AnalysisFlowContext = createContext<AnalysisFlow | null>(null)

// A transient handoff within the citizen layout; never persisted in browser storage.
export function useAnalysisFlow(): AnalysisFlow {
  const flow = useContext(AnalysisFlowContext)
  if (!flow) throw new Error('Analysis flow requires the citizen Layout')
  return flow
}
