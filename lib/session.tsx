import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  wallet: string | null;
  authToken: string | null;
  setSession: (next: { wallet: string | null; authToken: string | null }) => Promise<void>;
  loading: boolean;
};

const SessionContext = createContext<Session | null>(null);

const STORAGE_WALLET = 'vibeproof_wallet_v2';
const STORAGE_AUTH = 'vibeproof_authToken_v2';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const w = await AsyncStorage.getItem(STORAGE_WALLET);
        const a = await AsyncStorage.getItem(STORAGE_AUTH);
        if (w) setWallet(w);
        if (a) setAuthToken(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setSession = async (next: { wallet: string | null; authToken: string | null }) => {
    setWallet(next.wallet);
    setAuthToken(next.authToken);

    if (next.wallet) await AsyncStorage.setItem(STORAGE_WALLET, next.wallet);
    else await AsyncStorage.removeItem(STORAGE_WALLET);

    if (next.authToken) await AsyncStorage.setItem(STORAGE_AUTH, next.authToken);
    else await AsyncStorage.removeItem(STORAGE_AUTH);
  };

  const value = useMemo(() => ({ wallet, authToken, setSession, loading }), [wallet, authToken, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
