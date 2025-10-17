import React from 'react';
import type { BrokerAccount } from '../../types';
export function PortfolioSyncStatus({ brokerAccounts }: { brokerAccounts: BrokerAccount[] }) {
	return <div>PortfolioSyncStatus ({brokerAccounts.length} accounts)</div>;
}
