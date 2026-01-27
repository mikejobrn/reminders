'use client';

import React, { useState, useEffect } from 'react';
import { IoWifi, IoWifiOutline, IoCheckmark } from 'react-icons/io5';

export function SyncIndicator() {
    const [status, setStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleOnline = () => {
            setStatus('synced');
        };

        const handleOffline = () => {
            setStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            setStatus('offline');
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isMounted) return null;

    const getIcon = () => {
        switch (status) {
            case 'syncing':
                return <div className="animate-spin"><IoWifi size={16} /></div>;
            case 'offline':
                return <IoWifiOutline size={16} className="text-(--color-ios-orange)" />;
            case 'synced':
                return <IoCheckmark size={16} className="text-(--color-ios-green)" />;
        }
    };

    const getLabel = () => {
        switch (status) {
            case 'syncing':
                return 'Sincronizando...';
            case 'offline':
                return 'Offline';
            case 'synced':
                return 'Sincronizado';
        }
    };

    return (
        <div className="flex items-center gap-2 text-[12px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
            {getIcon()}
            <span>{getLabel()}</span>
        </div>
    );
}
