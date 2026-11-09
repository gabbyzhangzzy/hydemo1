import { useEffect, useState } from "react";
import { Check, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Brand } from "@/lib/demo/store";
import { Pill } from "./bits";

const FIELDS: [keyof Brand, string][] = [
  ["name", "Brand name"],
  ["description", "Business description"],
  ["industry", "Industry"],
  ["audience", "Target audience"],
  ["market", "Market"],
];

export function BrandCard({ brand, onConfirm, onSave, readOnly }: { brand: Brand; onConfirm?: (b: Brand) => void; onSave?: (b: Brand) => void; readOnly?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [b, setB] = useState(brand);
  useEffect(() => setB(brand), [brand]);
  const sourceLabel = brand.source === "bd" ? "Prefilled by Hellyeah BD" : brand.source === "ai" ? "AI-extracted from website" : "Entered manually";
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <span className="font-display text-sm font-semibold">Brand Profile · {brand.url}</span>
        </div>
        <div className="flex gap-1.5">
          <Pill tone="muted">{sourceLabel}</Pill>
          {brand.status === "draft" ? <Pill tone="warning">Draft — please review</Pill> : <Pill tone="success">Confirmed</Pill>}
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <div key={k} className={k === "description" ? "sm:col-span-2" : ""}>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label} {brand.status === "draft" && brand.source !== "manual" && <span className="normal-case tracking-normal text-brand">· draft</span>}
            </div>
            {edit ? (
              k === "description" ? (
                <Textarea value={b[k] as string} onChange={(e) => setB({ ...b, [k]: e.target.value })} />
              ) : (
                <Input value={b[k] as string} onChange={(e) => setB({ ...b, [k]: e.target.value })} />
              )
            ) : (
              <div className="text-sm font-medium">{b[k] as string}</div>
            )}
          </div>
        ))}
        <div className="sm:col-span-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brand assets</div>
          <div className="flex flex-wrap gap-1.5">{b.assets.map((a) => <Pill key={a}>{a}</Pill>)}</div>
        </div>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
          {edit ? (
            <Button size="sm" onClick={() => { setEdit(false); onSave?.(b); }}>
              <Check /> Save edits
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
              <Pencil /> Edit
            </Button>
          )}
          {brand.status === "draft" && onConfirm && (
            <Button size="sm" variant="brand" disabled={edit} onClick={() => onConfirm(b)}>
              <Check /> Confirm & continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
