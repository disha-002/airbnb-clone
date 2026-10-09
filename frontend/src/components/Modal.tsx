"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Bottom sheet on phones, centered dialog on laptops. */
export default function Modal({
  open, onClose, title, children, footer, wide = false,
}: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portal to <body> so a transformed ancestor (the animated header) can't trap `position: fixed`.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-2xl md:rounded-3xl ${wide ? "md:max-w-3xl" : "md:max-w-xl"}`}
      >
        <div className="relative flex items-center justify-center border-b border-hairline px-6 py-4">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-soft">×</button>
          <h2 className="font-semibold">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-between border-t border-hairline px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
