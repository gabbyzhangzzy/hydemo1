import { Download, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CAMPAIGNS, CHANNELS, COUNTRIES, DEVICES, OBJECTIVES, STATUSES,
  activeFilterCount, campaignCsv, resetAnalyticsFilters, setAnalyticsFilters,
  useAnalyticsFilters, type AnalyticsFilters,
} from "@/lib/demo/analytics-data";

function FilterSelect<T extends string>({ label, value, options, onChange, allLabel }: {
  label: string; value: T | "all"; options: readonly T[]; allLabel: string; onChange: (v: T | "all") => void;
}) {
  return (
    <div className="min-w-[140px] flex-1">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={(v) => onChange(v as T | "all")}>
        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FiltersBar({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const set = setAnalyticsFilters;
  const campaigns = CAMPAIGNS.filter((c) => clientIds.includes(c.clientId));

  const chips: { label: string; clear: () => void }[] = [];
  if (f.days !== 30) chips.push({ label: `Last ${f.days} days`, clear: () => set({ days: 30 }) });
  if (!f.compare) chips.push({ label: "No comparison", clear: () => set({ compare: true }) });
  if (f.channel !== "all") chips.push({ label: f.channel, clear: () => set({ channel: "all" }) });
  if (f.country !== "all") chips.push({ label: f.country, clear: () => set({ country: "all" }) });
  if (f.device !== "all") chips.push({ label: f.device, clear: () => set({ device: "all" }) });
  if (f.campaignId !== "all") chips.push({ label: campaigns.find((c) => c.id === f.campaignId)?.name ?? f.campaignId, clear: () => set({ campaignId: "all" }) });
  if (f.objective !== "all") chips.push({ label: `Objective: ${f.objective}`, clear: () => set({ objective: "all" }) });
  if (f.status !== "all") chips.push({ label: `Status: ${f.status}`, clear: () => set({ status: "all" }) });

  const exportCsv = () => {
    const csv = campaignCsv(clientIds, f);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hellyeah-campaign-performance-${f.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported", { description: "Filtered campaign performance table (demo data)." });
  };

  return (
    <section className="card-surface space-y-3 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date range</div>
          <div className="flex gap-1.5">
            <Select value={[7, 30, 90].includes(f.days) ? String(f.days) : "custom"} onValueChange={(v) => set({ days: v === "custom" ? 14 : Number(v) })}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {![7, 30, 90].includes(f.days) && (
              <Input type="number" min={2} max={90} className="h-9 w-20" value={f.days}
                onChange={(e) => set({ days: Math.max(2, Math.min(90, Number(e.target.value) || 14)) })} aria-label="Custom days" />
            )}
          </div>
        </div>
        <div className="min-w-[130px]">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comparison</div>
          <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
            <Switch checked={f.compare} onCheckedChange={(v) => set({ compare: v })} />
            {f.compare ? "Previous period" : "None"}
          </label>
        </div>
        <FilterSelect label="Channel" value={f.channel} options={CHANNELS} allLabel="All Channels" onChange={(v) => set({ channel: v })} />
        <FilterSelect label="Country" value={f.country} options={COUNTRIES} allLabel="All Countries" onChange={(v) => set({ country: v })} />
        <FilterSelect label="Device" value={f.device} options={DEVICES} allLabel="All Devices" onChange={(v) => set({ device: v })} />
        <div className="min-w-[180px] flex-1">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</div>
          <Select value={f.campaignId} onValueChange={(v) => set({ campaignId: v })}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FilterSelect label="Objective" value={f.objective} options={OBJECTIVES} allLabel="All Objectives" onChange={(v) => set({ objective: v })} />
        <FilterSelect label="Status" value={f.status} options={STATUSES} allLabel="All Statuses" onChange={(v) => set({ status: v })} />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {chips.map((c) => (
          <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground hover:bg-accent/70">
            {c.label} <X className="size-3" />
          </button>
        ))}
        {chips.length === 0 && <span className="text-xs text-muted-foreground">Default view · Last 30 days · all channels, countries and devices</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" disabled={activeFilterCount(f) === 0} onClick={() => setAnalyticsFilters({ ...f, ...Object.fromEntries(Object.keys(f).map((k) => [k, k === "compare" ? true : k === "days" ? 30 : "all"])) as Partial<AnalyticsFilters> })}>
            <X /> Clear All Filters
          </Button>
          <Button size="sm" variant="outline" onClick={resetAnalyticsFilters}><RotateCcw /> Reset to Default</Button>
          <Button size="sm" variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
        </div>
      </div>
    </section>
  );
}
