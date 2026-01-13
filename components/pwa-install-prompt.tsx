"use client";

import { useEffect, useState } from "react";
import { IoClose, IoDownloadOutline } from "react-icons/io5";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Verificar se já foi instalado ou se o usuário já recusou
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-(--color-ios-dark-gray-5) shadow-lg border border-(--color-ios-light-gray-4) dark:border-(--color-ios-dark-gray-4) p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) flex items-center justify-center">
            <IoDownloadOutline className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-(--color-ios-label) dark:text-(--color-ios-dark-label) mb-1">
              Instalar Lembretes
            </h3>
            <p className="text-[13px] text-(--color-ios-secondary-label) dark:text-(--color-ios-dark-secondary-label) leading-relaxed">
              Instale o app na sua tela inicial para acesso rápido e notificações
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 h-9 px-4 rounded-lg bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white text-[15px] font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="h-9 px-4 rounded-lg bg-(--color-ios-light-gray-3) dark:bg-(--color-ios-dark-gray-4) text-(--color-ios-label) dark:text-(--color-ios-dark-label) text-[15px] font-medium hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Agora não
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-7 h-7 rounded-full hover:bg-(--color-ios-light-gray-3) dark:hover:bg-(--color-ios-dark-gray-4) flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <IoClose className="w-5 h-5 text-(--color-ios-secondary-label) dark:text-(--color-ios-dark-secondary-label)" />
          </button>
        </div>
      </div>
    </div>
  );
}
