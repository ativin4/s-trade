import React from 'react';
import type { BrokerAccount } from '@/types';
export function BrokerConnectionCard({ account }: { account: BrokerAccount }) {
	return <div>BrokerConnectionCard: {account.brokerName}</div>;
}
