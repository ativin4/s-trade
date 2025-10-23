
import type { AIAnalysisResponse, UserSettings } from '@/app/types'

import { getGeminiInsights } from '@/lib/gemini'

export async function getAIInsights(
  symbols: string[],
  userSettings: UserSettings | null
): Promise<AIAnalysisResponse[]> {
  return getGeminiInsights(symbols, userSettings)
}
