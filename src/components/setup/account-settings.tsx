import type { User } from 'next-auth';

interface AccountSettingsProps {
  user: User | null;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  return <div>Account Settings</div>;
}
