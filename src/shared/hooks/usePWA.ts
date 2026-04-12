import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(() => isIOS() && !isStandaloneDisplay());
  const [isIosDevice] = useState(() => isIOS());
  const [isAndroidDevice] = useState(() => isAndroid());

  useEffect(() => {
    if (isInstalled || isIosDevice) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, isIosDevice]);

  const install = async () => {
    if (isIosDevice) {
      alert(
        'To install Lectum on iOS:\n\n' +
          '1. Tap the Share button at the bottom\n' +
          '2. Scroll down and tap "Add to Home Screen"\n' +
          '3. Tap "Add" in the top right',
      );
      return true;
    }

    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  };

  return {
    isInstalled,
    canInstall,
    install,
    isIosDevice,
    isAndroidDevice,
  };
}
