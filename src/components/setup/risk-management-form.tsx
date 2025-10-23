import type { UserSettings } from '@/types';

interface RiskManagementFormProps {
  userId: string;
  initialSettings: UserSettings | null;
}

export function RiskManagementForm({ userId, initialSettings }: RiskManagementFormProps) {
  return <div>Risk Management Form</div>;
}
