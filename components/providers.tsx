'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useSync } from '@/lib/hooks/useSync';
import React from 'react';

function SyncProvider({ children }: { children: React.ReactNode }) {
    useSync(true);
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SyncProvider>
                {children}
            </SyncProvider>
        </QueryClientProvider>
    );
}
