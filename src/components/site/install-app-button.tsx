"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, Menu, Share, SquarePlus, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallAppButton({
  className,
  variant = "outline",
  size = "sm",
  fullWidth = false,
  onInstallStart,
}: {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  fullWidth?: boolean;
  /** Called right before a native/manual install flow is triggered — handy for closing a mobile menu. */
  onInstallStart?: () => void;
}) {
  const { canPromptInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [modal, setModal] = useState<"ios" | "help" | null>(null);

  if (isInstalled) return null;

  const handleClick = async () => {
    onInstallStart?.();
    if (canPromptInstall) {
      await promptInstall();
      return;
    }
    setModal(isIOS ? "ios" : "help");
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        aria-label="Install the Mechanic On Call app"
        className={cn("gap-1.5", fullWidth && "w-full", className)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Install App
      </Button>
      {modal && <InstallInstructionsModal kind={modal} onClose={() => setModal(null)} />}
    </>
  );
}

function InstallInstructionsModal({ kind, onClose }: { kind: "ios" | "help"; onClose: () => void }) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={titleId} className="font-heading text-lg font-bold text-foreground">
            Install Mechanic On Call
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {kind === "ios" ? (
          <div id={descId} className="mt-4 flex flex-col gap-3 text-sm text-foreground/90">
            <p>To install Mechanic On Call on your iPhone or iPad:</p>
            <ol className="flex flex-col gap-2.5">
              <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Share className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  Tap the <strong className="text-foreground">Share</strong> icon in Safari&apos;s toolbar
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <SquarePlus className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  Select <strong className="text-foreground">Add to Home Screen</strong>
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div id={descId} className="mt-4 flex flex-col gap-3 text-sm text-foreground/90">
            <p>To install Mechanic On Call as an app:</p>
            <ol className="flex flex-col gap-2.5">
              <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Download className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  Look for the <strong className="text-foreground">install</strong> icon in your browser&apos;s address bar
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  Or open your browser menu and choose <strong className="text-foreground">Install app</strong> /{" "}
                  <strong className="text-foreground">Add to Home screen</strong>
                </span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Not seeing that option? Try the latest Chrome or Edge for the best install experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
