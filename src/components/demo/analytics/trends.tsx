import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/demo/bits";
import { dailySeries, filteredRows, fmtMoney, fmtNum, useAnalyticsFilters } from "@/lib/demo/analytics-data";

const CHANNEL_COLORS: Record<string, string> = { Meta: "var(--chart-2)", "Google Ads": "var(--chart-3)", "TikTok Ads": "var(--chart-1)" };

const METRICS = [
  { key: "cpm", label: "CPM", fmt: (v: number) => `$${v.toFixed(2)}`, get: (p: { cpm: number }) => p.cpm },
  { key: "ctr", label: "CTR %", fmt: (v: number) => `${v.toFixed(2)}%`, get: (p: { ctr: number }) => p.ctr },
  { key: "cpc", label: "CPC", fmt: (v: number) => `$${v.toFixed(2)}`, get: (p: { cpc: number }) => p.cpc },
  { key: "cpa", label: "CPA", fmt: (v: number) => `$${v.toFixed(2)}`, get: (p: { cpa: number | null }) => p.cpa ?? 0 },
  { key: "roas", label: "ROAS", fmt: (v: number) => `${v.toFixed(2)}×`, get: (p: { roas: number | null }) => p.roas ?? 0 },
  { key: "conv", label: "Conversions", fmt: (v: number) => fmtNum(v), get: (p: { conversions: number }) => p.conversions },
] as const;

export function TrendsSection({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const rows = filteredRows(clientIds, f);
  const cur = dailySeries(rows, f);
  const prev = f.compare ? dailySeries(filteredRows(clientIds, f, { previous: true }), f) : null;
  const [byChannel, setByChannel] = useState(false);
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("cpm");
  const m = METRICS.find((x) => x.key === metric)!;

  // Chart 1 data: daily spend, optionally stacked by channel.
  const spendData = cur.map((p) => {
    if (!byChannel) return { label: p.label, Spend: Math.round(p.spend) };
    const dayRows = rows.filter((r) => r.day === p.day);
    const out: Record<string, number | string> = { label: p.label };
    for (const ch of Object.keys(CHANNEL_COLORS)) {
      out[ch] = Math.round(dayRows.filter((r) => { const c = r.campaignId; return c && ch === channelOf(c); }).reduce((a, r) => a + r.spend, 0));
    }
    return out;
  });

  // Chart 2 data: selected metric, current vs previous period.
  const metricData = cur.map((p, i) => ({
    label: p.label,
    Current: Number(m.get(p).toFixed(3)),
    ...(prev ? { Previous: Number(m.get(prev[i] ?? p).toFixed(3)) } : {}),
  }));

  // Chart 3 data: dual-panel spend vs results.
  const dual = cur.map((p) => ({ label: p.label, Spend: Math.round(p.spend), Results: Math.round(p.conversions) }));
  const hasConversions = dual.some((d) => d.Results > 0);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Section title="Daily Advertising Spend" className="lg:col-span-2" right={
        <Select value={byChannel ? "channel" : "total"} onValueChange={(v) => setByChannel(v === "channel")}>
          <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Total spend</SelectItem>
            <SelectItem value="channel">By channel</SelectItem>
          </SelectContent>
        </Select>
      }>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={spendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
              <YAxis fontSize={11} tickFormatter={(v: number) => `$${fmtNum(v)}`} width={56} />
              <Tooltip formatter={(v: number, name: string) => [fmtMoney(v), name]} />
              {byChannel ? (
                Object.entries(CHANNEL_COLORS).map(([ch, color]) => (
                  <Area key={ch} type="monotone" dataKey={ch} stackId="1" stroke={color} fill={color} fillOpacity={0.5} isAnimationActive={false} />
                ))
              ) : (
                <Area type="monotone" dataKey="Spend" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.18} isAnimationActive={false} />
              )}
              {byChannel && <Legend fontSize={11} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Performance Trend" right={
        <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
          <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {METRICS.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}
          </SelectContent>
        </Select>
      }>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={metricData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
              <YAxis fontSize={11} tickFormatter={(v: number) => m.fmt(v)} width={56} />
              <Tooltip formatter={(v: number, name: string) => [m.fmt(v), name === "Current" ? `${m.label} (current)` : `${m.label} (previous)`]} />
              <Line type="monotone" dataKey="Current" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
              {prev && <Line type="monotone" dataKey="Previous" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
              <Legend fontSize={11} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title={hasConversions ? "Spend vs Results" : "Spend vs Results (conversions unavailable for this selection)"}>
        <div className="space-y-2">
          <div className="h-28">
            <ResponsiveContainer>
              <AreaChart data={dual} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" hide />
                <YAxis fontSize={10} tickFormatter={(v: number) => `$${fmtNum(v)}`} width={52} />
                <Tooltip formatter={(v: number) => [fmtMoney(v), "Daily Spend"]} />
                <Area type="monotone" dataKey="Spend" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-28">
            <ResponsiveContainer>
              <AreaChart data={dual} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
                <YAxis fontSize={10} tickFormatter={(v: number) => fmtNum(v)} width={52} />
                <Tooltip formatter={(v: number) => [fmtNum(v), "Daily Results"]} />
                <Area type="monotone" dataKey="Results" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground">Two aligned panels with separate scales — spend (top) and results (bottom) share the same date axis.</p>
        </div>
      </Section>
    </section>
  );
}

function channelOf(campaignId: string): string {
  if (campaignId.includes("-G-")) return "Google Ads";
  if (campaignId.includes("-TT-")) return "TikTok Ads";
  return "Meta";
}
