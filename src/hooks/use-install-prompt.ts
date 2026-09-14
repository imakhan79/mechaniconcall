"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function subscribeStandalone(callback: () => void): () => void {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

function detectIOS(): boolean {
  const nav = window.navigator as Navigator & { maxTouchPoints?: number };
  const isIPhoneOrIPad = /iPad|iPhone|iPod/.test(nav.userAgent);
  // iPadOS 13+ reports as "MacIntel" but, unlike a real Mac, exposes touch points.
  const isIPadDesktopUA = nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
  return isIPhoneOrIPad || isIPadDesktopUA;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedViaEvent, setInstalledViaEvent] = useState(false);
  const [isIOS] = useState(() => (typeof window === "undefined" ? false : detectIOS()));

  const isStandalone = useSyncExternalStore(subscribeStandalone, isStandaloneDisplay, getStandaloneServerSnapshot);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalledViaEvent(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return {
    canPromptInstall: deferredPrompt !== null,
    isInstalled: isStandalone || installedViaEvent,
    isIOS,
    promptInstall,
  };
}
