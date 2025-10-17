import React from 'react';
export function AddBrokerDialog({ brokerName, children }: { brokerName?: string; children?: React.ReactNode }) {
	return <div>AddBrokerDialog {brokerName}{children}</div>;
}
