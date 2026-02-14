import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export const APP_IDENTITY = {
  name: 'VibeProof',
  uri: 'https://vibeproof.app',
  icon: 'favicon.ico',
};

export const CHAIN = 'solana:devnet';

export async function connectAndSignIn(existingAuthToken?: string | null) {
  return await transact(async (wallet: Web3MobileWallet) => {
    const authorization = await wallet.authorize({
      chain: CHAIN,
      identity: APP_IDENTITY,
      auth_token: existingAuthToken ?? undefined,
      sign_in_payload: {
        domain: 'vibeproof.app',
        statement: 'Sign in to VibeProof to track your streak and XP.',
        uri: 'https://vibeproof.app',
      },
    });

    const account = authorization.accounts?.[0];
    if (!account?.address) throw new Error('No account returned from wallet');

    return {
      walletAddress: account.address,
      authToken: authorization.auth_token,
      signInResult: authorization.sign_in_result ?? null,
    };
  });
}
