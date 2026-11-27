import { createAuthClient } from '@neon/auth';
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters';

const authUrl =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-morning-sea-bdolwkuy.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth';

export const authClient = createAuthClient(authUrl, {
  adapter: BetterAuthReactAdapter(),
});
