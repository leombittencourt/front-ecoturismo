import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Compass, Trees, Waves } from 'lucide-react';

type GlobalLoadingContextType = {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promiseFactory: () => Promise<T>, message?: string) => Promise<T>;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

function GlobalLoadingOverlay({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-emerald-900/75 via-cyan-900/70 to-teal-900/75 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/20 bg-black/25 px-8 py-6 text-center shadow-xl">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Trees className="h-7 w-7 text-emerald-100 animate-pulse" />
          <Waves className="h-7 w-7 text-cyan-100 animate-pulse [animation-delay:180ms]" />
          <Compass className="h-7 w-7 text-teal-100 animate-pulse [animation-delay:360ms]" />
        </div>
        <p className="text-sm sm:text-base font-medium text-white/95">{message}</p>
      </div>
    </div>
  );
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState('Carregando...');

  const startLoading = useCallback((nextMessage?: string) => {
    if (nextMessage?.trim()) setMessage(nextMessage.trim());
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(promiseFactory: () => Promise<T>, nextMessage?: string): Promise<T> => {
      startLoading(nextMessage);
      try {
        return await promiseFactory();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const value = useMemo<GlobalLoadingContextType>(
    () => ({
      isLoading: loadingCount > 0,
      message,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [loadingCount, message, startLoading, stopLoading, withLoading]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay visible={loadingCount > 0} message={message} />
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  return context;
}
