import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Image as ImageIcon, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Empty, Pill, Section } from "@/components/demo/bits";
import { actions, useDemo } from "@/lib/demo/store";
import { CreativePreview } from "@/components/demo/creative/preview";
import { CREATIVE_PREVIEWS, makeVersion } from "@/lib/demo/creative-seed";
import {
  adBreakdown, campaignById, campaignTable, dailySeries, filteredRows, fmtMoney, fmtNum, fmtPct,
  groupAgg, rangeLabel, useAnalyticsFilters, type AdRow, type CampaignRow,
} from "@/lib/demo/analytics-data";

type SortKey = "name" | "spend" | "impressions" | "clicks" | "ctr" | "cpc" | "cpm" | "conversions" | "cpa" | "roas";
const COLS: { key: SortKey; label: string; fmt: (r: CampaignRow) => string }[] = [
  { key: "spend", label: "Spend", fmt: (r) => fmtMoney(r.spend) },
  { key: "impressions", label: "Impr.", fmt: (r) => fmtNum(r.impressions) },
  { key: "clicks", label: "Clicks", fmt: (r) => fmtNum(r.clicks) },
  { key: "ctr", label: "CTR", fmt: (r) => fmtPct(r.ctr) },
  { key: "cpc", label: "CPC", fmt: (r) => fmtMoney(r.cpc) },
  { key: "cpm", label: "CPM", fmt: (r) => fmtMoney(r.cpm) },
  { key: "conversions", label: "Results", fmt: (r) => (r.meta.conversionsAvailable ? fmtNum(r.conversions) : "N/A") },
  { key: "cpa", label: "Cost/Res.", fmt: (r) => (r.cpa == null || !r.meta.conversionsAvailable ? "N/A" : fmtMoney(r.cpa)) },
  { key: "roas", label: "ROAS", fmt: (r) => (r.roas == null ? "N/A" : `${r.roas.toFixed(2)}×`) },
];
const PAGE_SIZE = 6;

export function CampaignTable({ clientIds, onOpenCampaign }: { clientIds: string[]; onOpenCampaign: (id: string) => void }) {
  const f = useAnalyticsFilters();
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let t = campaignTable(clientIds, f);
    if (q.trim()) t = t.filter((r) => r.meta.name.toLowerCase().includes(q.trim().toLowerCase()));
    const val = (r: CampaignRow): number | string => (sortKey === "name" ? r.meta.name : (r[sortKey] ?? -1));
    return [...t].sort((a, b) => {
      const va = val(a), vb = val(b);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return cmp * sortDir;
    });
  }, [clientIds, f, q, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const sortBtn = (key: SortKey, label: string, right = true) => (
    <button className={`inline-flex items-center gap-0.5 font-medium ${right ? "justify-end w-full" : ""}`} onClick={() => { if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(key); setSortDir(-1); } setPage(0); }}>
      {label} {sortKey === key ? (sortDir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
    </button>
  );

  return (
    <Section title="Campaign Performance" right={
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search campaigns" className="h-8 w-52 pl-8 text-xs" />
      </div>
    }>
      {pageRows.length === 0 ? <Empty title="No campaigns match the current filters" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">{sortBtn("name", "Campaign", false)}</th>
                <th className="py-2 pr-3 font-medium">Channel</th>
                <th className="py-2 pr-3 font-medium">Objective</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Geo</th>
                {COLS.map((c) => <th key={c.key} className="py-2 pr-3 text-right">{sortBtn(c.key, c.label)}</th>)}
                <th className="py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.meta.id} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50" onClick={() => onOpenCampaign(r.meta.id)}>
                  <td className="py-2.5 pr-3 font-medium">{r.meta.name}</td>
                  <td className="py-2.5 pr-3">{r.meta.channel}</td>
                  <td className="py-2.5 pr-3">{r.meta.objective}</td>
                  <td className="py-2.5 pr-3"><Pill tone={r.meta.status === "Active" ? "success" : r.meta.status === "Paused" ? "warning" : "muted"}>{r.meta.status}</Pill></td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{r.meta.geo}</td>
                  {COLS.map((c) => <td key={c.key} className="py-2.5 pr-3 text-right tabular-nums">{c.fmt(r)}</td>)}
                  <td className="py-2.5 text-muted-foreground">{r.meta.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{rows.length} campaigns · page {page + 1} of {pages}</span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ------------------------- Campaign detail ------------------------ */
export function CampaignDetail({ clientIds, campaignId, onClose, onOpenAd }: { clientIds: string[]; campaignId: string; onClose: () => void; onOpenAd: (campaignId: string, adId: string) => void }) {
  const f = useAnalyticsFilters();
  const meta = campaignById(campaignId);
  const rows = filteredRows(clientIds, { ...f, campaignId });
  if (!meta) return null;
  const series = dailySeries(rows, f);
  const countries = groupAgg(rows, "country");
  const devices = groupAgg(rows, "device");
  const ads = adBreakdown(campaignId, rows);
  const total = series.reduce((a, p) => a + p.spend, 0);

  return (
    <Section title={
      <span className="flex items-center gap-2">
        {meta.name}
        <Pill tone={meta.status === "Active" ? "success" : meta.status === "Paused" ? "warning" : "muted"}>{meta.status}</Pill>
      </span>
    } right={<Button size="sm" variant="ghost" onClick={onClose}><X /> Close</Button>}>
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div><div className="text-muted-foreground">Channel</div><div className="font-semibold">{meta.channel}</div></div>
        <div><div className="text-muted-foreground">Objective</div><div className="font-semibold">{meta.objective}</div></div>
        <div><div className="text-muted-foreground">Geography</div><div className="font-semibold">{meta.geo}</div></div>
        <div><div className="text-muted-foreground">Spend ({rangeLabel(f)})</div><div className="font-semibold">{fmtMoney(total)}</div></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Daily spend</div>
          <div className="h-36">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" fontSize={10} interval="preserveStartEnd" />
                <YAxis fontSize={10} tickFormatter={(v: number) => `$${fmtNum(v)}`} width={48} />
                <Tooltip formatter={(v: number) => [fmtMoney(v), "Spend"]} />
                <Area type="monotone" dataKey="spend" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">By country</div>
            <ul className="space-y-1 text-xs">
              {countries.map((g) => <li key={g.name} className="flex justify-between"><span>{g.name}</span><span className="tabular-nums text-muted-foreground">{fmtMoney(g.a.spend)}</span></li>)}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">By device</div>
            <ul className="space-y-1 text-xs">
              {devices.map((g) => <li key={g.name} className="flex justify-between"><span>{g.name}</span><span className="tabular-nums text-muted-foreground">{fmtMoney(g.a.spend)}</span></li>)}
            </ul>
          </div>
          <div className="col-span-2">
            <div className="mb-1 text-xs font-semibold text-muted-foreground">Placements</div>
            <ul className="space-y-1 text-xs">
              {meta.placements.map((p) => <li key={p.name} className="flex justify-between"><span>{p.name}</span><span className="tabular-nums text-muted-foreground">{(p.share * 100).toFixed(0)}% of impr · CPM ~{fmtMoney(meta.cpm * p.cpmMul)} · freq {p.freq.toFixed(1)}</span></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold">Ad Performance</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Ad</th><th className="py-1.5 pr-3 font-medium">Ad Set</th><th className="py-1.5 pr-3 font-medium">Format</th><th className="py-1.5 pr-3 font-medium">Status</th>
                <th className="py-1.5 pr-3 text-right font-medium">Spend</th><th className="py-1.5 pr-3 text-right font-medium">Impr.</th><th className="py-1.5 pr-3 text-right font-medium">Clicks</th><th className="py-1.5 pr-3 text-right font-medium">CTR</th><th className="py-1.5 pr-3 text-right font-medium">CPC</th><th className="py-1.5 pr-3 text-right font-medium">CPM</th><th className="py-1.5 pr-3 text-right font-medium">Results</th><th className="py-1.5 pr-3 text-right font-medium">CPA</th><th className="py-1.5 text-right font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a) => (
                <tr key={a.ad.id} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50" onClick={() => onOpenAd(campaignId, a.ad.id)}>
                  <td className="py-2 pr-3"><span className="font-medium">{a.ad.name}</span> <span className="font-mono text-[10px] text-muted-foreground">{a.ad.id}</span></td>
                  <td className="py-2 pr-3 text-muted-foreground">{a.ad.adset}</td>
                  <td className="py-2 pr-3">{a.ad.format}</td>
                  <td className="py-2 pr-3"><Pill tone={a.ad.status === "Active" ? "success" : "muted"}>{a.ad.status}</Pill></td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtMoney(a.spend)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(a.impressions)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(a.clicks)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtPct(a.ctr)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtMoney(a.cpc)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtMoney(a.cpm)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{meta.conversionsAvailable ? fmtNum(a.conversions) : "N/A"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{a.cpa == null || !meta.conversionsAvailable ? "N/A" : fmtMoney(a.cpa)}</td>
                  <td className="py-2 text-right tabular-nums">{a.roas == null ? "N/A" : `${a.roas.toFixed(2)}×`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------- Ad detail drawer ----------------------- */
export function AdDrawer({ clientIds, campaignId, adId, onClose }: { clientIds: string[]; campaignId: string | null; adId: string | null; onClose: () => void }) {
  const s = useDemo();
  const f = useAnalyticsFilters();
  const navigate = useNavigate();
  const meta = campaignId ? campaignById(campaignId) : undefined;
  const rows = useMemo(() => (campaignId ? filteredRows(clientIds, { ...f, campaignId }) : []), [clientIds, f, campaignId]);
  const ads = useMemo(() => (campaignId ? adBreakdown(campaignId, rows) : []), [campaignId, rows]);
  const ad = ads.find((a) => a.ad.id === adId);
  const open = !!meta && !!ad;
  const usage = s.creativeUsage.find(u=>u.adId===adId&&u.campaignId===campaignId);
  const asset = s.creativeAssets.find(a=>a.id===(usage?.creativeId??ad?.ad.creativeId));
  const version = asset?.versions.find(v=>v.number===(usage?.version??asset.current));

  const ask = (agent: "UA Agent" | "Creative Agent") => {
    if (!meta || !ad) return;
    const title = `Ad review: ${ad.ad.name}`.slice(0, 80);
    const prompt = [
      `@${agent} — from the Analytics ad detail (${rangeLabel(f)}):`,
      `Ad “${ad.ad.name}” (${ad.ad.id}) in campaign “${meta.name}” (${meta.channel}).`,
      `Performance: spend ${fmtMoney(ad.spend)}, CTR ${fmtPct(ad.ctr)}, CPM ${fmtMoney(ad.cpm)}${ad.cpa != null ? `, CPA ${fmtMoney(ad.cpa)}` : ""}.`,
      agent === "Creative Agent" ? "Assess the creative and suggest iteration directions based on its performance." : "Diagnose this ad's performance and recommend next steps. Do not change budgets without approval.",
    ].join("\n");
    if(asset&&version) actions.creativeTask(asset.id,version.number,agent==="UA Agent"?"analysis":"revision",prompt);
    else actions.startGenericTask(meta.clientId, title, agent, prompt);
    toast(`${agent} task created`, { description: `Context for ${ad.ad.id} was passed to the workspace.` });
    onClose();
    void navigate({ to: "/workspace" });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {meta && ad && (
          <>
            <SheetHeader>
              <SheetTitle>{ad.ad.name}</SheetTitle>
              <SheetDescription>{meta.name} · {ad.ad.adset} · {meta.channel}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="overflow-hidden rounded-lg"><CreativePreview version={version??makeVersion(CREATIVE_PREVIEWS[meta.clientId==='clientb'?12:Math.abs(ad.ad.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0))%12]??'')}/></div>
              <p className="text-xs text-muted-foreground">Illustrative demo creative preview{version?` · V${version.number}`:''}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  ["Spend", fmtMoney(ad.spend)], ["Impressions", fmtNum(ad.impressions)], ["Clicks", fmtNum(ad.clicks)],
                  ["CTR", fmtPct(ad.ctr)], ["CPM", fmtMoney(ad.cpm)], ["CPC", fmtMoney(ad.cpc)],
                  ["Results", meta.conversionsAvailable ? fmtNum(ad.conversions) : "N/A"], ["CPA", ad.cpa == null || !meta.conversionsAvailable ? "N/A" : fmtMoney(ad.cpa)], ["ROAS", ad.roas == null ? "N/A" : `${ad.roas.toFixed(2)}×`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-2"><div className="text-muted-foreground">{k}</div><div className="font-semibold tabular-nums">{v}</div></div>
                ))}
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">Campaign daily spend (context)</div>
                <div className="h-28">
                  <ResponsiveContainer>
                    <BarChart data={dailySeries(rows, f)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" fontSize={10} interval="preserveStartEnd" />
                      <YAxis fontSize={10} tickFormatter={(v: number) => `$${fmtNum(v)}`} width={44} />
                      <Tooltip formatter={(v: number) => [fmtMoney(v), "Spend"]} />
                      <Bar dataKey="spend" fill="var(--chart-2)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <div className="mb-1 font-semibold">AI diagnostic (demo)</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Observation: CTR {fmtPct(ad.ctr)} vs campaign average — {ad.ctr > 0 && ad.cpc > 0 ? "see table for comparison" : "insufficient data"}.</li>
                  <li>• Possible explanation: placement mix and audience fatigue can move CTR; correlation is not causation.</li>
                  <li>• Next step: ask the UA or Creative Agent for a deeper read before changing anything.</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { onClose(); void navigate({ to: "/creative", search: asset&&version?{asset:asset.id,version:version.number}:{} }); }}>View Creative</Button>
                <Button size="sm" variant="outline" onClick={() => ask("UA Agent")}>Ask UA Agent</Button>
                <Button size="sm" variant="outline" onClick={() => ask("Creative Agent")}>Ask Creative Agent</Button>
                <Button size="sm" variant="brand" onClick={() => ask("UA Agent")}>Create Optimization Task</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
