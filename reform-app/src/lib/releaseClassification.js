export const CPS_OPTIONS = [
  'Low Risk (0-30)',
  'Medium Risk (31-60)',
  'High Risk (61-100)',
]

export const ASPIRE_OPTIONS = ['Low', 'Moderate', 'High']
export const PFI_OPTIONS = ['Any', 'Low', 'Moderate', 'Strong']

const RULES = [
  ['High Risk (61-100)', 'Low', 'Any', 'Not eligible for release'],
  ['High Risk (61-100)', 'Moderate', 'Low', 'Continue rehabilitation'],
  ['High Risk (61-100)', 'High', 'Moderate', 'Structured review'],
  ['High Risk (61-100)', 'High', 'Strong', 'Conditional release (exceptional cases only)'],
  ['Medium Risk (31-60)', 'Low', 'Any', 'Not ready for release'],
  ['Medium Risk (31-60)', 'Moderate', 'Moderate', 'Conditional release'],
  ['Medium Risk (31-60)', 'High', 'Strong', 'Supervised release'],
  ['Low Risk (0-30)', 'Low', 'Low', 'Release deferred'],
  ['Low Risk (0-30)', 'Moderate', 'Moderate', 'Conditional release'],
  ['Low Risk (0-30)', 'High', 'Strong', 'Suitable for release'],
]

export const RELEASE_RULES = RULES.map(([cps, aspire, pfi, decision]) => ({
  cps, aspire, pfi, decision,
}))

export function getReleaseDecision(cps, aspire, pfi) {
  if (!cps || !aspire || !pfi) return ''
  const rule = RELEASE_RULES.find((item) => (
    item.cps === cps &&
    item.aspire === aspire &&
    (item.pfi === pfi || item.pfi === 'Any')
  ))
  return rule?.decision || 'Combination requires multidisciplinary review'
}
