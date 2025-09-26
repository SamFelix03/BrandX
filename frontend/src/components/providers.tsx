'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import AuthSync from './auth-sync';
import AuthMiddleware from './auth-middleware';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id"}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        appearance: {
          theme: 'dark',
        },
        // Configure login methods to include Google OAuth
        loginMethods: ['email', 'google', 'wallet'],
        // Set Google as the default login method
      }}
    >
      <AuthSync />
      <AuthMiddleware />
      {children}
    </PrivyProvider>
  );
}