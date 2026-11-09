import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/demo/store";

type Tone = "success" | "warning" | "info" | "danger" | "muted" | "brand" | "primary";
const toneCls: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/12 text-info border-info/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  muted: "bg-muted text-muted-foreground border-border",
  brand: "bg-brand-soft text-brand border-brand/25",
  primary: "bg-accent text-accent-foreground border-primary/15",
};

export function Pill({ tone = "muted", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current animate-pulse-dot" />}
      {children}
    </span>
  );
}

export const TASK_TONE: Record<TaskStatus, Tone> = { running: "info", waiting_approval: "warning", blocked: "danger", completed: "success", failed: "danger" };
export const TASK_LABEL: Record<TaskStatus, string> = { running: "Running", waiting_approval: "Waiting for Approval", blocked: "Blocked", completed: "Completed", failed: "Failed" };

export function TaskPill({ status }: { status: TaskStatus }) {
  return (
    <Pill tone={TASK_TONE[status]} dot={status === "running"}>
      {TASK_LABEL[status]}
    </Pill>
  );
}

export function Demo({ children = "Demo data" }: { children?: ReactNode }) {
  return <Pill tone="brand" className="uppercase tracking-wide text-[9px]">{children}</Pill>;
}
export function Phase({ p }: { p: "P0" | "P1" | "P2" }) {
  return <Pill tone={p === "P0" ? "primary" : "muted"} className="text-[9px] uppercase tracking-wide">{p === "P0" ? "P0" : `${p} · Planned`}</Pill>;
}

export function PageHeader({ title, sub, right, eyebrow }: { title: string; sub?: string; right?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold text-foreground md:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Section({ title, right, children, className }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "brand" | "danger" | undefined }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-semibold", tone === "brand" && "text-brand", tone === "danger" && "text-danger")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
