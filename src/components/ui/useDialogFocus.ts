import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

interface ActiveDialog {
  dialog: HTMLElement;
  opener: HTMLElement | null;
  onClose: () => void;
}

let activeDialogs: ActiveDialog[] = [];

function getFocusable(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((element) =>
      !element.matches(":disabled, [aria-disabled='true']")
      && !element.closest("[aria-hidden='true'], [inert]")
      && element.getClientRects().length > 0
      && getComputedStyle(element).visibility !== "hidden",
    );
}

function focusTarget(dialog: HTMLElement) {
  const preferred = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]");
  const focusable = getFocusable(dialog);
  if (preferred && focusable.includes(preferred)) return preferred;
  return focusable[0] ?? dialog;
}

export function useDialogFocus<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const entry: ActiveDialog = {
      dialog,
      opener: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      onClose,
    };
    activeDialogs = [...activeDialogs, entry];
    focusTarget(dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeDialogs[activeDialogs.length - 1] !== entry) return;
      if (event.key === "Escape") {
        event.preventDefault();
        entry.onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable(dialog);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const wasTop = activeDialogs[activeDialogs.length - 1] === entry;
      activeDialogs = activeDialogs.filter((active) => active !== entry);
      if (!wasTop) return;

      const parent = activeDialogs[activeDialogs.length - 1]?.dialog;
      if (entry.opener?.isConnected && (!parent || parent.contains(entry.opener))) {
        entry.opener.focus();
      } else if (parent?.isConnected) {
        focusTarget(parent).focus();
      } else if (entry.opener?.isConnected) {
        entry.opener.focus();
      }
    };
  }, [open, onClose]);

  return dialogRef;
}
