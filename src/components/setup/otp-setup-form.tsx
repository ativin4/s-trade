import type { UserSettings } from '@/types';

interface OtpSetupFormProps {
  userId: string;
  initialSettings: UserSettings | null;
}

export function OtpSetupForm({ userId, initialSettings }: OtpSetupFormProps) {
  return <div>OTP Setup Form</div>;
}
