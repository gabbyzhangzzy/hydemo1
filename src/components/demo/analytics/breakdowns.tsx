import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/demo/bits";
import {
  CAMPAIGNS, adBreakdown, campaignTable, filteredRows, fmtMoney, fmtNum, fmtPct, groupAgg,
  scopedCampaigns, setAnalyticsFilters, useAnalyticsFilters, type Agg,
} from "@/lib/demo/analytics-data";

const CHANNEL_COLORS: Record<string, string> = { Meta: "var(--chart-2)", "Google Ads": "var(--chart-3)", "TikTok Ads": "var(--chart-1)" };
const DEVICE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];

type BreakMetric = "spend" | "impressions" | "ctr" | "cpm" | "conversions" | "cpa" | "roas";
const BREAK_METRICS: { key: BreakMetric; label: string; get: (a: Agg) => number | null; fmt: (v: number) => string }[] = [
  { key: "spend", label: "Ad Spend", get: (a) => a.spend, fmt: fmtMoney },
  { key: "impressions", label: "Impressions", get: (a) => a.impressions, fmt: fmtNum },
  { key: "ctr", label: "CTR", get: (a) => a.ctr, fmt: fmtPct },
  { key: "cpm", label: "CPM", get: (a) => a.cpm, fmt: fmtMoney },
  { key: "conversions", label: "Conversions", get: (a) => a.conversions, fmt: fmtNum },
  { key: "cpa", label: "CPA", get: (a) => a.cpa, fmt: fmtMoney },
  { key: "roas", label: "ROAS", get: (a) => a.roas, fmt: (v) => `${v.toFixed(2)}×` },
];

function MetricSelect({ value, onChange }: { value: BreakMetric; onChange: (v: BreakMetric) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BreakMetric)}>
      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
      <SelectContent>{BREAK_METRICS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export function CountryBreakdown({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const [metric, setMetric] = useState<BreakMetric>("spend");
  const m = BREAK_METRICS.find((x) => x.key === metric)!;
  const rows = filteredRows(clientIds, f);
  const groups = groupAgg(rows, "country").map((g) => ({ ...g, v: m.get(g.a) })).filter((g) => g.v != null && g.v > 0);
  const totalSpend = groups.reduce((a, g) => a + g.a.spend, 0);
  return (
    <Section title="Country Performance" right={<MetricSelect value={metric} onChange={setMetric} />}>
      <div className="h-52">
        <ResponsiveContainer>
          <BarChart data={groups} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" fontSize={11} tickFormatter={(v: number) => m.fmt(v)} />
            <YAxis type="category" dataKey="name" fontSize={11} width={96} />
            <Tooltip formatter={(v: number) => [m.fmt(v), m.label]} />
            <Bar dataKey="v" fill="var(--chart-2)" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d) => { const name = (d as unknown as { name: string }).name; setAnalyticsFilters({ country: name as never }); }} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-3 w-full text-xs">
        <thead><tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1 font-medium">Country</th><th className="py-1 text-right font-medium">Spend</th><th className="py-1 text-right font-medium">Share</th><th className="py-1 text-right font-medium">Results</th><th className="py-1 text-right font-medium">Cost / Result</th><th className="py-1 text-right font-medium">ROAS</th>
        </tr></thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.name} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50" onClick={() => setAnalyticsFilters({ country: g.name as never })}>
              <td className="py-1.5 font-medium">{g.name}</td>
              <td className="py-1.5 text-right">{fmtMoney(g.a.spend)}</td>
              <td className="py-1.5 text-right">{totalSpend > 0 ? `${((g.a.spend / totalSpend) * 100).toFixed(0)}%` : "—"}</td>
              <td className="py-1.5 text-right">{fmtNum(g.a.conversions)}</td>
              <td className="py-1.5 text-right">{g.a.cpa == null ? "N/A" : fmtMoney(g.a.cpa)}</td>
              <td className="py-1.5 text-right">{g.a.roas == null ? "N/A" : `${g.a.roas.toFixed(2)}×`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">Click a country to filter the dashboard.</p>
    </Section>
  );
}

export function ChannelBreakdown({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const [metric, setMetric] = useState<"spend" | "impressions" | "conversions">("spend");
  const rows = filteredRows(clientIds, f);
  const camps = scopedCampaigns(clientIds, { ...f, channel: "all" });
  const byChannel = Object.keys(CHANNEL_COLORS).map((ch) => {
    const ids = new Set(camps.filter((c) => c.channel === ch).map((c) => c.id));
    const rs = rows.filter((r) => ids.has(r.campaignId));
    const a = rs.reduce(
      (acc, r) => ({ spend: acc.spend + r.spend, impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks, conversions: acc.conversions + r.conversions, revenue: acc.revenue + r.revenue }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    );
    return { channel: ch, ...a, ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0, cpc: a.clicks > 0 ? a.spend / a.clicks : 0, cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0, cpa: a.conversions > 0 ? a.spend / a.conversions : null, roas: a.spend > 0 && a.revenue > 0 ? a.revenue / a.spend : null };
  }).filter((c) => c.spend > 0);
  const fmt = metric === "spend" ? fmtMoney : fmtNum;
  return (
    <Section title="Channel Performance" right={
      <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="spend">Spend</SelectItem>
          <SelectItem value="impressions">Impressions</SelectItem>
          <SelectItem value="conversions">Results</SelectItem>
        </SelectContent>
      </Select>
    }>
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={byChannel} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="channel" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(v: number) => fmt(v)} width={56} />
            <Tooltip formatter={(v: number) => [fmt(v), metric === "conversions" ? "Results" : metric]} />
            <Bar dataKey={metric} radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d) => { const ch = (d as unknown as { channel: string }).channel; setAnalyticsFilters({ channel: ch as never }); }} isAnimationActive={false}>
              {byChannel.map((c) => <Cell key={c.channel} fill={CHANNEL_COLORS[c.channel]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-3 w-full text-xs">
        <thead><tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1 font-medium">Channel</th><th className="py-1 text-right font-medium">Spend</th><th className="py-1 text-right font-medium">Impr.</th><th className="py-1 text-right font-medium">Clicks</th><th className="py-1 text-right font-medium">CTR</th><th className="py-1 text-right font-medium">CPC</th><th className="py-1 text-right font-medium">CPM</th><th className="py-1 text-right font-medium">Results</th><th className="py-1 text-right font-medium">Cost/Res.</th><th className="py-1 text-right font-medium">ROAS</th>
        </tr></thead>
        <tbody>
          {byChannel.map((c) => (
            <tr key={c.channel} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50" onClick={() => setAnalyticsFilters({ channel: c.channel as never })}>
              <td className="py-1.5 font-medium"><span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: CHANNEL_COLORS[c.channel] }} />{c.channel}</td>
              <td className="py-1.5 text-right">{fmtMoney(c.spend)}</td>
              <td className="py-1.5 text-right">{fmtNum(c.impressions)}</td>
              <td className="py-1.5 text-right">{fmtNum(c.clicks)}</td>
              <td className="py-1.5 text-right">{fmtPct(c.ctr)}</td>
              <td className="py-1.5 text-right">{fmtMoney(c.cpc)}</td>
              <td className="py-1.5 text-right">{fmtMoney(c.cpm)}</td>
              <td className="py-1.5 text-right">{fmtNum(c.conversions)}</td>
              <td className="py-1.5 text-right">{c.cpa == null ? "N/A" : fmtMoney(c.cpa)}</td>
              <td className="py-1.5 text-right">{c.roas == null ? "N/A" : `${c.roas.toFixed(2)}×`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export function DeviceBreakdown({ clientIds }: { clientIds: string[] }) {
  const f = useAnalyticsFilters();
  const [metric, setMetric] = useState<"spend" | "impressions" | "conversions">("spend");
  const rows = filteredRows(clientIds, f);
  const groups = groupAgg(rows, "device");
  const data = groups.map((g, i) => ({ name: g.name, value: Math.round(g.a[metric]), a: g.a, fill: DEVICE_COLORS[i % DEVICE_COLORS.length] }));
  const total = data.reduce((a, d) => a + d.value, 0);
  const fmt = metric === "spend" ? fmtMoney : fmtNum;
  return (
    <Section title="Device Performance" right={
      <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="spend">Spend</SelectItem>
          <SelectItem value="impressions">Impressions</SelectItem>
          <SelectItem value="conversions">Results</SelectItem>
        </SelectContent>
      </Select>
    }>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} cursor="pointer" onClick={(d) => { const name = (d as unknown as { name: string }).name; setAnalyticsFilters({ device: name as never }); }} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [`${fmt(v)} · ${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-52 flex-1 space-y-2">
          {data.map((d) => (
            <button key={d.name} onClick={() => setAnalyticsFilters({ device: d.name as never })} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-muted/50">
              <span className="flex items-center gap-2 font-medium"><span className="size-2.5 rounded-full" style={{ background: d.fill }} />{d.name}</span>
              <span className="text-muted-foreground">{fmt(d.value)} · {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}% · CTR {fmtPct(d.a.ctr)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Click a segment to filter the dashboard by device.</p>
    </Section>
  );
}

export function CampaignEfficiency({ clientIds, onOpenCampaign }: { clientIds: string[]; onOpenCampaign: (id: string) => void }) {
  const f = useAnalyticsFilters();
  const [mode, setMode] = useState<"cpa" | "cpm">("cpa");
  const table = campaignTable(clientIds, f);
  const convMode = mode === "cpa";
  const data = table
    .filter((c) => (convMode ? c.meta.conversionsAvailable && c.cpa != null && c.conversions > 0 : c.impressions > 0))
    .map((c) => ({
      id: c.meta.id, name: c.meta.name.replace(/^Freebeat — |^Client B — /, ""), channel: c.meta.channel,
      x: Math.round(c.spend), y: Number((convMode ? c.cpa! : c.cpm).toFixed(2)), z: Math.max(80, convMode ? c.conversions : c.impressions / 100),
    }));
  return (
    <Section title="Campaign Efficiency" right={
      <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="cpa">Spend vs CPA (conversion campaigns)</SelectItem>
          <SelectItem value="cpm">Spend vs CPM (awareness view)</SelectItem>
        </SelectContent>
      </Select>
    }>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No campaigns with {convMode ? "conversion tracking" : "delivery"} in the current selection.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" dataKey="x" name="Spend" fontSize={11} tickFormatter={(v: number) => `$${fmtNum(v)}`} label={{ value: "Spend", position: "insideBottomRight", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name={convMode ? "CPA" : "CPM"} fontSize={11} tickFormatter={(v: number) => `$${v}`} width={52} label={{ value: convMode ? "CPA" : "CPM", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[80, 900]} name={convMode ? "Conversions" : "Impressions"} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
                const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-md">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-muted-foreground">{p.channel}</div>
                    <div>Spend {fmtMoney(p.x)} · {convMode ? "CPA" : "CPM"} ${p.y}</div>
                  </div>
                );
              }} />
              <Scatter data={data} cursor="pointer" onClick={(d) => onOpenCampaign((d as unknown as { id: string }).id)} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.id} fill={CHANNEL_COLORS[d.channel]} fillOpacity={0.75} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {Object.entries(CHANNEL_COLORS).map(([ch, c]) => <span key={ch} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: c }} />{ch}</span>)}
        <span>Bubble size = {convMode ? "conversions" : "impressions"} · click a bubble to open the campaign</span>
      </div>
    </Section>
  );
}

export function CreativeBreakdown({ clientIds, onOpenAd }: { clientIds: string[]; onOpenAd: (campaignId: string, adId: string) => void }) {
  const f = useAnalyticsFilters();
  const [metric, setMetric] = useState<"spend" | "ctr" | "conversions" | "cpa" | "roas">("spend");
  const rows = filteredRows(clientIds, f);
  const camps = scopedCampaigns(clientIds, f);
  const ads = camps.flatMap((c) => adBreakdown(c.id, rows));
  const get = (a: (typeof ads)[number]) => (metric === "cpa" || metric === "roas" ? a[metric] : a[metric]);
  const data = ads
    .filter((a) => { const v = get(a); return v != null && v > 0; })
    .sort((a, b) => (metric === "cpa" ? get(a)! - get(b)! : get(b)! - get(a)!))
    .slice(0, 8)
    .map((a) => ({ name: a.ad.name.length > 26 ? a.ad.name.slice(0, 26) + "…" : a.ad.name, full: a.ad.name, v: Number(get(a)!.toFixed(3)), campaignId: a.ad.campaignId, adId: a.ad.id, format: a.ad.format }));
  const fmt = metric === "ctr" ? fmtPct : metric === "conversions" ? fmtNum : metric === "roas" ? (v: number) => `${v.toFixed(2)}×` : fmtMoney;
  return (
    <Section title="Creative Performance" right={
      <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="spend">Spend</SelectItem>
          <SelectItem value="ctr">CTR</SelectItem>
          <SelectItem value="conversions">Results</SelectItem>
          <SelectItem value="cpa">CPA</SelectItem>
          <SelectItem value="roas">ROAS</SelectItem>
        </SelectContent>
      </Select>
    }>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" fontSize={11} tickFormatter={(v: number) => fmt(v)} />
            <YAxis type="category" dataKey="name" fontSize={10} width={150} />
            <Tooltip formatter={(v: number, _n, item) => [fmt(v), (item?.payload as { full?: string } | undefined)?.full ?? "Ad"]} />
            <Bar dataKey="v" fill="var(--chart-1)" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d) => { const p = d as unknown as { campaignId: string; adId: string }; onOpenAd(p.campaignId, p.adId); }} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Top ads by {metric === "conversions" ? "results" : metric.toUpperCase()} · click a bar to open the ad detail.</p>
    </Section>
  );
}

export { CAMPAIGNS };
