"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// @ts-ignore
import { createPortal } from 'react-dom';

type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  linkLabel?: string;
  linkHref?: string;
};

type ToastInternal = Required<Pick<ToastOptions, "id">> &
  Omit<ToastOptions, "id">;

type ToastContextValue = {
  addToast: (opts: ToastOptions) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, opts: Partial<ToastOptions>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getColors(variant: ToastVariant | undefined) {
  switch (variant) {
    case "success":
      return {
        bg: "rgba(16,185,129,0.2)",
        border: "1px solid rgba(16,185,129,0.5)",
        color: "#eafff6",
      };
    case "error":
      return {
        bg: "rgba(244,63,94,0.18)",
        border: "1px solid rgba(244,63,94,0.5)",
        color: "#fff1f2",
      };
    default:
      return {
        bg: "#1e293b", // Slate-800 solid
        border: "1px solid #475569", // Slate-600
        color: "#ffffff",
      };
  }
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, opts: Partial<ToastOptions>) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
            ...t,
            title: opts.title ?? t.title,
            description: opts.description ?? t.description,
            variant: opts.variant ?? t.variant,
            duration:
              typeof opts.duration === "number" ? opts.duration : t.duration,
            actionLabel: opts.actionLabel ?? t.actionLabel,
            onAction: opts.onAction ?? t.onAction,
            loading: opts.loading ?? (t as any).loading,
            linkLabel: opts.linkLabel ?? (t as any).linkLabel,
            linkHref: opts.linkHref ?? (t as any).linkHref,
          }
          : t
      )
    );
  }, []);

  const addToast = useCallback(
    (opts: ToastOptions) => {
      const id = opts.id ?? genId();
      const toast: ToastInternal = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? "info",
        duration: opts.duration ?? 3000,
        actionLabel: opts.actionLabel,
        onAction: opts.onAction,
        loading: opts.loading ?? false,
        linkLabel: opts.linkLabel,
        linkHref: opts.linkHref,
      };
      // Deduplicate: if same message is currently visible, don't add a new one
      const same = (a?: ToastInternal) =>
        !!a &&
        a.title === toast.title &&
        a.description === toast.description &&
        a.variant === toast.variant;
      console.log('🍞 addToast called:', toast);
      setToasts((prev) => {
        if (prev.length > 0 && same(prev[0])) {
          console.log('🍞 Duplicate toast ignored');
          return prev; // keep current toast; avoid re-announcement spam
        }
        // Show only one toast at a time: replace any existing toast
        return [toast];
      });
      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({ addToast, removeToast, updateToast }),
    [addToast, removeToast, updateToast]
  );


  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toastContainer = mounted ? createPortal(
    <div
      id="toast-portal"
      className="toast-container"
      aria-live="assertive"
      aria-atomic="true"
      aria-relevant="additions"
      style={{
        position: "fixed",
        top: 100,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 99999, // Max Z-Index
        pointerEvents: "none",
      }}
    >
      {toasts.slice(0, 1).map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastContainer}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastInternal;
  onClose: () => void;
}) {
  const actionBtnRef = useRef<HTMLButtonElement | null>(null);
  const actionLinkRef = useRef<HTMLAnchorElement | null>(null);
  const dismissBtnRef = useRef<HTMLButtonElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);

  // Auto-focus action button/link or fallback to dismiss when the toast mounts
  useEffect(() => {
    const el =
      actionBtnRef.current || actionLinkRef.current || dismissBtnRef.current;
    if (!el) return;
    const id = window.setTimeout(() => el.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Auto-close after duration, pause on hover
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    if (hovered) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    timeoutRef.current = window.setTimeout(() => {
      onClose();
    }, toast.duration);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [toast.duration, hovered, onClose]);

  const colors = getColors(toast.variant);

  return (
    <div
      role="status"
      aria-atomic="true"
      aria-busy={toast.loading ? true : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bg,
        border: colors.border,
        color: colors.color,
        padding: "0.75rem 0.875rem",
        borderRadius: 12,
        minWidth: 280,
        maxWidth: 420,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        pointerEvents: "auto",
        transform: "translateY(0)",
        transition: "transform 160ms ease, opacity 160ms ease",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
        {toast.loading && (
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              marginTop: 4,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.35)",
              borderTopColor: "#ffffff",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <div
              style={{
                fontWeight: 700,
                marginBottom: toast.description ? 4 : 0,
              }}
            >
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div style={{ opacity: 0.9, fontSize: "0.9rem", lineHeight: 1.35 }}>
              {toast.description}
            </div>
          )}
          {(toast.actionLabel || toast.linkLabel || true) && (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              {toast.actionLabel && (
                <button
                  ref={actionBtnRef}
                  onClick={() => {
                    toast.onAction?.();
                    onClose();
                  }}
                  aria-label={toast.actionLabel}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
              {!toast.actionLabel && toast.linkLabel && toast.linkHref && (
                <a
                  ref={actionLinkRef}
                  href={toast.linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={toast.linkLabel}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#ffffff",
                    fontWeight: 700,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {toast.linkLabel}
                </a>
              )}
              {/* Always include a dismiss button to ensure keyboard access */}
              <button
                ref={dismissBtnRef}
                onClick={onClose}
                aria-label="Dismiss notification"
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
