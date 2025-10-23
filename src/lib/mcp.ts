import { ExternalAPIError } from "@/app/types";
import { BrokerAccount, PortfolioHolding } from "@/app/types";

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL;

export async function getMcpPortfolio(
  account: BrokerAccount
): Promise<PortfolioHolding[]> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/portfolio`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify({ accountId: account.accountId }),
      }
    );

    if (!response.ok) {
      throw new ExternalAPIError(
        `Failed to fetch portfolio from MCP server: ${response.statusText}`,
        account.brokerName
      );
    }

    const data = await response.json();
    return data.portfolio;
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      throw error;
    }
    throw new ExternalAPIError(
      `Failed to fetch portfolio from MCP server: ${error.message}`,
      account.brokerName
    );
  }
}
