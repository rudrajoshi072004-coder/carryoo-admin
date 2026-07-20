import { api, unwrapList } from '../client'
import type { PricingRule, PricingRuleInput } from '../types'

export async function listPricingRules(): Promise<PricingRule[]> {
  const { data } = await api.get('/pricing-rules/')
  return unwrapList<PricingRule>(data)
}

export async function createPricingRule(input: PricingRuleInput): Promise<PricingRule> {
  const { data } = await api.post<PricingRule>('/pricing-rules/', input)
  return data
}

export async function updatePricingRule(id: string, input: Partial<PricingRuleInput>): Promise<PricingRule> {
  const { data } = await api.patch<PricingRule>(`/pricing-rules/${id}/`, input)
  return data
}

export async function deletePricingRule(id: string): Promise<void> {
  await api.delete(`/pricing-rules/${id}/`)
}
