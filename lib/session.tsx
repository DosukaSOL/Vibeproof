import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  wallet: string | null;
  setWallet: (w: string | null) => Promise<void>;
  loading: boolean;
};

const SessionContext = createContext<Session | null>(null);

const STORAGE_KEY = 'vibeproof_wallet_v1';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [wallet, _setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) _setWallet(saved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setWallet = async (w: string | null) => {
    _setWallet(w);
    if (!w) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, w);
    }
  };

  const value = useMemo(() => ({ wallet, setWallet, loading }), [wallet, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
