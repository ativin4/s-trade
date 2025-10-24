import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIAnalysisResponse, UserSettings } from "@/app/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getGeminiInsights(
  symbols: string[],
  userSettings: UserSettings | null
): Promise<AIAnalysisResponse[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    As an expert stock market analyst, provide trading recommendations for the following stocks: ${symbols.join(", ")}.

    Consider the following user preferences:
    - Risk Tolerance: ${userSettings?.riskTolerance}
    - Max Budget Per Trade: ${userSettings?.maxBudgetPerTrade}
    - Excluded Sectors: ${userSettings?.excludedSectors.join(", ")}
    - Preferred Market Cap: ${userSettings?.preferredMarketCap}

    For each stock, provide the following information in JSON format:
    - symbol: The stock symbol.
    - recommendation: Your recommendation (BUY, SELL, HOLD, STRONG_BUY, STRONG_SELL).
    - confidence: Your confidence in the recommendation (0 to 1).
    - reasoning: A brief explanation for your recommendation.
    - targetPrice: The target price for the stock.
    - stopLoss: The stop-loss price for the stock.
    - timeframe: The expected timeframe for the recommendation (e.g., 1-3 Months).
    - riskLevel: The risk level of the investment (LOW, MEDIUM, HIGH, VERY_HIGH).
    - keyFactors: An array of key factors that influenced your recommendation.
    - createdAt: The current date and time in ISO format.

    Return the response as a JSON array of objects, with each object representing a stock.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    console.error("Error getting insights from Gemini:", error);
    return [];
  }
}
