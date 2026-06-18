import type { BrokerAccount } from '@/app/types';

interface BrokerPreferencesProps {
  userId: string;
  brokerAccounts: BrokerAccount[];
}

export function BrokerPreferences({ userId, brokerAccounts }: BrokerPreferencesProps) {
  return <div>Broker Preferences</div>;
}
