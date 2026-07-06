import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);

  // Load dismissal status from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('pwaDismissedUntil');
    if (dismissed) {
      setDismissedUntil(parseInt(dismissed));
    }
  }, []);

  // Check if app is already installed
  useEffect(() => {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalledCheck = isStandalone || (window.navigator as any).standalone === true;
    setIsInstalled(isInstalledCheck);
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for successful installation
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showPrompt = (): boolean => {
    if (isInstalled) return false;
    if (!isInstallable) return false;
    if (!deferredPrompt) return false;

    // Check if dismissed within last 7 days
    if (dismissedUntil && Date.now() < dismissedUntil) {
      return false;
    }

    return true;
  };

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const dismissBanner = () => {
    // Dismiss for 7 days (7 * 24 * 60 * 60 * 1000 milliseconds)
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwaDismissedUntil', sevenDaysFromNow.toString());
    setDismissedUntil(sevenDaysFromNow);
    setIsInstallable(false);
  };

  return {
    showPrompt: showPrompt(),
    installApp,
    dismissBanner,
    isInstalled,
    isInstallable,
  };
};