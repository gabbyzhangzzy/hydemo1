import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  agg, dailySeries, filteredRows, fmtDelta, fmtMoney, fmtNum, fmtPct,
  useAnalyticsFilters, type Agg,
} from "@/lib/demo/analytics-data";

interface KpiDef {
  key: string;
  label: string;
  tip: string;
  value: (a: Agg) => number | null;
  fmt: (v: number) => string;
  goodWhenUp: boolean | null; // null = neutral (e.g. spend)
  series: (p: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }) => number;
}

const KPIS: KpiDef[] = [
  { key: "spend", label: "Ad Spend", tip: "Total advertising spend across the filtered campaigns. Higher spend is not automatically better.", value: (a) => a.spend, fmt: fmtMoney, goodWhenUp: null, series: (p) => p.spend },
  { key: "impressions", label: "Impressions", tip: "Total ad impressions delivered.", value: (a) => a.impressions, fmt: fmtNum, goodWhenUp: null, series: (p) => p.impressions },
  { key: "reach", label: "Reach", tip: "Estimated deduplicated people reached. Segment reach is approximate; totals use campaign-level estimates.", value: (a) => a.reach, fmt: fmtNum, goodWhenUp: null, series: (p) => p.impressions },
  { key: "clicks", label: "Clicks", tip: "Total link clicks.", value: (a) => a.clicks, fmt: fmtNum, goodWhenUp: null, series: (p) => p.clicks },
  { key: "ctr", label: "CTR", tip: "Click-through rate = Clicks ÷ Impressions × 100. Aggregated from totals, not averaged.", value: (a) => a.ctr, fmt: fmtPct, goodWhenUp: true, series: (p) => (p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0) },
  { key: "cpm", label: "CPM", tip: "Cost per 1,000 impressions = Spend ÷ Impressions × 1,000. Lower CPM alone does not prove better business performance.", value: (a) => a.cpm, fmt: fmtMoney, goodWhenUp: false, series: (p) => (p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0) },
  { key: "cpc", label: "CPC", tip: "Cost per click = Spend ÷ Clicks.", value: (a) => a.cpc, fmt: fmtMoney, goodWhenUp: false, series: (p) => (p.clicks > 0 ? p.spend / p.clicks : 0) },
  { key: "conv", label: "Conversions", tip: "Attributed results. TikTok conversion data is unavailable in this demo (shown as delivered events only).", value: (a) => a.conversions, fmt: fmtNum, goodWhenUp: true, series: (p) => p.conversions },
  { key: "cpa", label: "CPA", tip: "Cost per acquisition = Spend ÷ Conversions. Lower is generally favorable for comparable conversion quality.", value: (a) => a.cpa, fmt: fmtMoney, goodWhenUp: false, series: (p) => (p.conversions > 0 ? p.spend / p.conversions : 0) },
  { key: "roas", label: "ROAS", tip: "Return on ad spend = Attributed Revenue ÷ Spend. Only shown where revenue tracking exists.", value: (a) => a.roas, fmt: (v) => `${v.toFixed(2)}×`, goodWhenUp: true, series: (p) => (p.spend > 0 ? p.revenue / p.spend : 0) },
  { key: "freq", label: "Frequency", tip: "Average impressions per reached person = Impressions ÷ Reach.", value: (a) => a.frequency, fmt: (v) => v.toFixed(2), goodWhenUp: null, series: (p) => p.impressions },
];

/** Objective-aware ordering: emphasize the metrics that matter for the filtered objective. */
const OBJECTIVE_PRIORITY: Record<string, string[]> = {
  Awareness: ["reach", "impressions", "cpm", "freq"],
  Traffic: ["clicks", "ctr", "cpc", "spend"],
  Leads: ["conv", "cpa", "ctr", "spend"],
  Conversions: ["conv", "cpa", "roas", "spend"],
};

export function KpiSummary({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const cur = agg(filteredRows(clientIds, f));
  const prev = f.compare ? agg(filteredRows(clientIds, f, { previous: true })) : null;
  const series = dailySeries(filteredRows(clientIds, f), f);

  let defs = KPIS.filter((k) => (k.key === "roas" ? cur.roas != null : true));
  const priority = f.objective !== "all" ? OBJECTIVE_PRIORITY[f.objective] : undefined;
  if (priority) {
    defs = [...defs].sort((a, b) => (priority.indexOf(a.key) === -1 ? 99 : priority.indexOf(a.key)) - (priority.indexOf(b.key) === -1 ? 99 : priority.indexOf(b.key)));
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Executive Summary</h2>
        {f.objective !== "all" && <span className="text-xs text-muted-foreground">Metrics prioritized for {f.objective} campaigns</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {defs.map((k) => {
          const v = k.value(cur);
          const pv = prev ? k.value(prev) : null;
          const delta = v != null && pv != null ? fmtDelta(v, pv) : null;
          const good = delta && k.goodWhenUp != null ? (delta.up === k.goodWhenUp) : null;
          const spark = series.filter((_, i) => i % Math.ceil(series.length / 24) === 0).map((p) => ({ v: k.series(p) }));
          return (
            <div key={k.key} className="card-surface p-3.5">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {k.label}
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="size-3 cursor-help" /></TooltipTrigger>
                    <TooltipContent className="max-w-64 text-xs">{k.tip}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{v == null ? <span className="text-muted-foreground">N/A</span> : k.fmt(v)}</div>
              <div className="mt-0.5 flex h-4 items-center gap-1 text-[11px]">
                {delta ? (
                  <span className={cn("inline-flex items-center gap-0.5 font-semibold", good === true && "text-success", good === false && "text-danger", good == null && "text-muted-foreground")}>
                    {delta.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} {delta.text}
                    <span className="font-normal text-muted-foreground">vs prev {pv != null ? k.fmt(pv) : ""}</span>
                  </span>
                ) : <span className="text-muted-foreground">No comparison</span>}
              </div>
              <div className="mt-1 h-8">
                <ResponsiveContainer>
                  <AreaChart data={spark} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                    <Area type="monotone" dataKey="v" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.12} strokeWidth={1.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
