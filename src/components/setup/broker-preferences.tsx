import type { BrokerAccount } from '@/types';

interface BrokerPreferencesProps {
  userId: string;
  brokerAccounts: BrokerAccount[];
}

export function BrokerPreferences({ userId, brokerAccounts }: BrokerPreferencesProps) {
  return <div>Broker Preferences</div>;
}
