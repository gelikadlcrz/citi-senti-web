/**
 * Canonical aspect taxonomy. Content follows
 * supabase/migrations/20261124124934_seed_reference_data.sql.
 * Example text is illustrative, not the output of a running model.
 */
export interface AspectCategory {
  code: string
  name: string
  description: string
  example: string | null
}

export const aspects: AspectCategory[] = [
  {
    code: 'A01',
    name: 'Policy Benefits and Impact',
    description:
      'Opinions concerning the overall usefulness, effectiveness, benefits, disadvantages, or general consequences of a policy or government initiative.',
    example: 'This ordinance will really help the community.',
  },
  {
    code: 'A02',
    name: 'Implementation and Enforcement',
    description:
      'Opinions concerning how a policy is carried out, monitored, implemented, followed, or enforced.',
    example: 'Maganda yung ordinance pero hindi naman ini-implement.',
  },
  {
    code: 'A03',
    name: 'Cost, Fees and Penalties',
    description:
      'Opinions concerning the monetary costs, payments, fees, fines, penalties, or financial burdens associated with a policy or government service.',
    example: 'Sobrang taas naman ng penalty.',
  },
  {
    code: 'A04',
    name: 'Accessibility and Convenience',
    description:
      'Opinions concerning how easy or difficult it is for citizens to access, use, comply with, participate in, or benefit from a government policy, program, or service.',
    example: 'Residents should also be able to apply online.',
  },
  {
    code: 'A05',
    name: 'Fairness and Inclusivity',
    description:
      'Opinions concerning whether a policy or government action treats individuals, communities, or population groups equitably and inclusively.',
    example: 'The rule disadvantages people who cannot afford private parking.',
  },
  {
    code: 'A06',
    name: 'Rules and Policy Provisions',
    description:
      'Opinions concerning the content, design, conditions, requirements, restrictions, exemptions, or specific provisions of a policy or ordinance.',
    example: 'The two-hour parking limit is too short.',
  },
  {
    code: 'A07',
    name: 'Government Administration and Responsiveness',
    description:
      'Opinions concerning how government offices, agencies, and officials manage, communicate, coordinate, administer, or respond to matters involving public policies and services.',
    example: 'The city should explain the new policy more clearly.',
  },
  {
    code: 'A08',
    name: 'Public Safety and Security',
    description:
      'Opinions concerning the actual or expected effects of a policy or government initiative on public safety, protection, or security.',
    example: 'The loading zone will make pedestrians safer.',
  },
  {
    code: 'A09',
    name: 'Environmental Impact',
    description:
      'Opinions concerning the actual or expected effects of policies and government initiatives on environmental conditions, resources, and sustainability.',
    example: 'This could reduce plastic waste in the city.',
  },
  {
    code: 'A10',
    name: 'Traffic and Transportation Impact',
    description:
      'Opinions concerning the effects of policies or government initiatives on mobility, transportation, traffic conditions, parking availability, and movement within the city.',
    example: 'This will make traffic along Session Road worse.',
  },
  {
    code: 'A11',
    name: 'Other',
    description:
      'Meaningful policy-related aspects that cannot reasonably be classified under any of the ten established substantive categories.',
    example: null,
  },
]

export const sentimentLabels = [
  {
    name: 'Positive',
    tone: 'positive',
    definition: 'A favorable evaluation of the detected aspect.',
    example: '“The new loading zone keeps pedestrians safer.”',
  },
  {
    name: 'Neutral',
    tone: 'neutral',
    definition: 'A factual statement or an evaluation with no clear positive or negative polarity.',
    example: '“The loading zone was introduced this month.”',
  },
  {
    name: 'Negative',
    tone: 'negative',
    definition: 'An unfavorable evaluation or criticism of the detected aspect.',
    example: '“The new loading zone is inconvenient for commuters.”',
  },
] as const
