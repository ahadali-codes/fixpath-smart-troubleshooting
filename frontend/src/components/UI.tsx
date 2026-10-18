import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
export function ErrorBox({ text }: { text: string }) {
  return text ? (
    <div role="alert" className="error">
      <AlertTriangle size={17} />
      {text}
    </div>
  ) : null;
}
export function Spinner() {
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" /> Loading your workspace…
    </div>
  );
}
export function Badge({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Heading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <header className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </header>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <CheckCircle2 size={30} />
      {children}
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const latestClose = useRef(close);
  latestClose.current = close;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const dialog = ref.current;
    const elements = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button,input,textarea,select,a[href]",
        ) || [],
      ).filter((e) => !e.hasAttribute("disabled"));
    elements()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latestClose.current();
      if (e.key === "Tab") {
        const all = elements();
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === all.at(-1)) {
          e.preventDefault();
          all[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="modal"
      >
        <div className="row between">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function NextIcon() {
  return <ArrowRight size={17} />;
}
