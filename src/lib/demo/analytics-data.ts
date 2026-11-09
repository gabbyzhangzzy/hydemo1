import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Shared mock advertising dataset (BlueFocus · Freebeat + Client B)   */
/*                                                                     */
/* One coherent dataset powers every KPI, chart, table and insight.    */
/* Rows are generated once at module load with a seeded PRNG so the    */
/* numbers are stable across reloads and always reconcile: KPI totals  */
/* equal the sum of the filtered rows, and every breakdown is a        */
/* grouping of the same rows.                                          */
/* ------------------------------------------------------------------ */

export type Channel = "Meta" | "Google Ads" | "TikTok Ads";
export type Country = "United States" | "United Kingdom" | "Canada" | "Germany" | "Australia";
export type Device = "Mobile" | "Desktop" | "Tablet";
export type Objective = "Awareness" | "Traffic" | "Leads" | "Conversions";
export type CampStatus = "Active" | "Paused" | "Completed";

export const CHANNELS: Channel[] = ["Meta", "Google Ads", "TikTok Ads"];
export const COUNTRIES: Country[] = ["United States", "United Kingdom", "Canada", "Germany", "Australia"];
export const DEVICES: Device[] = ["Mobile", "Desktop", "Tablet"];
export const OBJECTIVES: Objective[] = ["Awareness", "Traffic", "Leads", "Conversions"];
export const STATUSES: CampStatus[] = ["Active", "Paused", "Completed"];

export const DAYS = 90; // day 0 = oldest, day 89 = today
const DAY_MS = 86_400_000;
export function dateOf(day: number): Date {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return new Date(today.getTime() - (DAYS - 1 - day) * DAY_MS);
}
export function dayLabel(day: number): string {
  return dateOf(day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------------- Seeded PRNG ---------------------------- */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngFor = (key: string) => mulberry32(hash(key));

/* ------------------------- Campaign metadata ---------------------- */
export interface AdMeta {
  id: string;
  campaignId: string;
  name: string;
  adset: string;
  format: "Video" | "Image" | "Carousel";
  status: "Active" | "Paused";
  creativeId?: string; // links into CREATIVES in the demo store
  weight: number; // relative share of campaign delivery
  ctrMul: number; // creative-level CTR multiplier
}
export interface PlacementMeta {
  name: string;
  share: number; // share of campaign impressions
  cpmMul: number;
  freq: number;
}
export interface CampaignMeta {
  id: string;
  clientId: string;
  name: string;
  channel: Channel;
  objective: Objective;
  status: CampStatus;
  geo: string;
  startDay: number;
  endDay: number;
  dailyBudget: number;
  cpm: number;
  ctr: number; // as fraction, e.g. 0.018
  cvr: number; // click → conversion
  aov: number | null; // revenue per conversion; null = no revenue tracking
  freq: number;
  conversionsAvailable: boolean;
  countries: [Country, number][];
  devices: [Device, number][];
  placements: PlacementMeta[];
  ads: AdMeta[];
  updated: string;
}

const US: [Country, number][] = [["United States", 1]];
const DEVICE_STD: [Device, number][] = [["Mobile", 0.72], ["Desktop", 0.2], ["Tablet", 0.08]];

export const CAMPAIGNS: CampaignMeta[] = [
  {
    id: "CMP-FB-SPRING", clientId: "freebeat", name: "Freebeat — Spring Launch", channel: "Meta", objective: "Awareness", status: "Completed", geo: "United States",
    startDay: 0, endDay: 29, dailyBudget: 140, cpm: 7.1, ctr: 0.011, cvr: 0.004, aov: null, freq: 1.9, conversionsAvailable: true,
    countries: US, devices: DEVICE_STD,
    placements: [
      { name: "Instagram Reels", share: 0.42, cpmMul: 0.86, freq: 1.5 },
      { name: "Facebook Feed", share: 0.38, cpmMul: 1.12, freq: 2.4 },
      { name: "Instagram Stories", share: 0.2, cpmMul: 0.98, freq: 1.8 },
    ],
    ads: [
      { id: "AD-SP-01", campaignId: "CMP-FB-SPRING", name: "“Drop the beat” 15s vertical", adset: "US Broad 18–34", format: "Video", status: "Paused", creativeId: "A-01", weight: 0.45, ctrMul: 1.25 },
      { id: "AD-SP-02", campaignId: "CMP-FB-SPRING", name: "Creator remix montage 30s", adset: "US Broad 18–34", format: "Video", status: "Paused", creativeId: "A-02", weight: 0.35, ctrMul: 1.1 },
      { id: "AD-SP-03", campaignId: "CMP-FB-SPRING", name: "“Any song → video” static", adset: "US Interest stack", format: "Image", status: "Paused", creativeId: "A-03", weight: 0.2, ctrMul: 0.7 },
    ],
    updated: "Ended 60 days ago",
  },
  {
    id: "CMP-FB-REELS", clientId: "freebeat", name: "Freebeat — Reels Creator Push", channel: "Meta", objective: "Traffic", status: "Active", geo: "US · UK · CA",
    startDay: 30, endDay: 89, dailyBudget: 220, cpm: 6.2, ctr: 0.019, cvr: 0.006, aov: null, freq: 1.7, conversionsAvailable: true,
    countries: [["United States", 0.62], ["United Kingdom", 0.22], ["Canada", 0.16]], devices: [["Mobile", 0.86], ["Desktop", 0.1], ["Tablet", 0.04]],
    placements: [
      { name: "Instagram Reels", share: 0.58, cpmMul: 0.82, freq: 1.4 },
      { name: "Facebook Feed", share: 0.24, cpmMul: 1.18, freq: 2.6 },
      { name: "Instagram Stories", share: 0.18, cpmMul: 0.95, freq: 1.7 },
    ],
    ads: [
      { id: "AD-RC-01", campaignId: "CMP-FB-REELS", name: "“Drop the beat” 15s vertical", adset: "Reels Broad", format: "Video", status: "Active", creativeId: "A-01", weight: 0.4, ctrMul: 1.35 },
      { id: "AD-RC-02", campaignId: "CMP-FB-REELS", name: "Creator remix montage 30s", adset: "Reels Broad", format: "Video", status: "Active", creativeId: "A-02", weight: 0.38, ctrMul: 1.28 },
      { id: "AD-RC-03", campaignId: "CMP-FB-REELS", name: "Beat-sync teaser loop 10s", adset: "Reels Lookalike", format: "Video", status: "Active", weight: 0.22, ctrMul: 0.85 },
    ],
    updated: "12 min ago",
  },
  {
    id: "CMP-FB-CONV", clientId: "freebeat", name: "Freebeat — Install Conversion Drive", channel: "Meta", objective: "Conversions", status: "Active", geo: "US · UK · DE",
    startDay: 45, endDay: 89, dailyBudget: 320, cpm: 9.4, ctr: 0.014, cvr: 0.052, aov: 14.5, freq: 2.1, conversionsAvailable: true,
    countries: [["United States", 0.55], ["United Kingdom", 0.25], ["Germany", 0.2]], devices: DEVICE_STD,
    placements: [
      { name: "Instagram Reels", share: 0.5, cpmMul: 0.88, freq: 1.8 },
      { name: "Facebook Feed", share: 0.32, cpmMul: 1.1, freq: 2.7 },
      { name: "Instagram Stories", share: 0.18, cpmMul: 1.0, freq: 2.0 },
    ],
    ads: [
      { id: "AD-CD-01", campaignId: "CMP-FB-CONV", name: "“Made with my own song” UGC", adset: "US Converters LAL", format: "Video", status: "Active", weight: 0.42, ctrMul: 1.3 },
      { id: "AD-CD-02", campaignId: "CMP-FB-CONV", name: "3-step tutorial carousel", adset: "US Converters LAL", format: "Carousel", status: "Active", weight: 0.3, ctrMul: 0.95 },
      { id: "AD-CD-03", campaignId: "CMP-FB-CONV", name: "“Any song → video” static", adset: "DE Broad", format: "Image", status: "Active", creativeId: "A-03", weight: 0.28, ctrMul: 0.72 },
    ],
    updated: "12 min ago",
  },
  {
    id: "CMP-G-SEARCH", clientId: "freebeat", name: "Freebeat — Branded Search", channel: "Google Ads", objective: "Leads", status: "Active", geo: "US · CA · AU",
    startDay: 0, endDay: 89, dailyBudget: 95, cpm: 38, ctr: 0.048, cvr: 0.09, aov: null, freq: 1.1, conversionsAvailable: true,
    countries: [["United States", 0.6], ["Canada", 0.22], ["Australia", 0.18]], devices: [["Mobile", 0.55], ["Desktop", 0.38], ["Tablet", 0.07]],
    placements: [{ name: "Search", share: 1, cpmMul: 1, freq: 1.1 }],
    ads: [
      { id: "AD-GS-01", campaignId: "CMP-G-SEARCH", name: "Brand exact — “freebeat”", adset: "Brand terms", format: "Image", status: "Active", weight: 0.5, ctrMul: 1.4 },
      { id: "AD-GS-02", campaignId: "CMP-G-SEARCH", name: "“AI music video maker”", adset: "Generic terms", format: "Image", status: "Active", weight: 0.3, ctrMul: 0.9 },
      { id: "AD-GS-03", campaignId: "CMP-G-SEARCH", name: "“song to video app”", adset: "Generic terms", format: "Image", status: "Active", weight: 0.2, ctrMul: 0.75 },
    ],
    updated: "26 min ago",
  },
  {
    id: "CMP-G-UAC", clientId: "freebeat", name: "Freebeat — App Installs (Google)", channel: "Google Ads", objective: "Conversions", status: "Paused", geo: "United States",
    startDay: 20, endDay: 64, dailyBudget: 150, cpm: 12.5, ctr: 0.021, cvr: 0.041, aov: 12.0, freq: 1.6, conversionsAvailable: true,
    countries: US, devices: [["Mobile", 0.9], ["Desktop", 0.06], ["Tablet", 0.04]],
    placements: [{ name: "YouTube In-Stream", share: 0.6, cpmMul: 1.05, freq: 1.7 }, { name: "Display Network", share: 0.4, cpmMul: 0.8, freq: 1.4 }],
    ads: [
      { id: "AD-GU-01", campaignId: "CMP-G-UAC", name: "Install video 15s", adset: "UAC default", format: "Video", status: "Paused", weight: 0.6, ctrMul: 1.1 },
      { id: "AD-GU-02", campaignId: "CMP-G-UAC", name: "Install static pack", adset: "UAC default", format: "Image", status: "Paused", weight: 0.4, ctrMul: 0.8 },
    ],
    updated: "Paused 25 days ago",
  },
  {
    id: "CMP-TT-VIRAL", clientId: "freebeat", name: "Freebeat — TikTok Viral Hooks", channel: "TikTok Ads", objective: "Awareness", status: "Active", geo: "US · UK · AU · DE",
    startDay: 38, endDay: 89, dailyBudget: 180, cpm: 4.6, ctr: 0.013, cvr: 0.005, aov: null, freq: 2.4, conversionsAvailable: false,
    countries: [["United States", 0.48], ["United Kingdom", 0.2], ["Australia", 0.17], ["Germany", 0.15]], devices: [["Mobile", 0.94], ["Desktop", 0.04], ["Tablet", 0.02]],
    placements: [{ name: "TikTok Feed", share: 1, cpmMul: 1, freq: 2.4 }],
    ads: [
      { id: "AD-TV-01", campaignId: "CMP-TT-VIRAL", name: "Hook: “POV your song becomes a video”", adset: "Broad 18–34", format: "Video", status: "Active", weight: 0.44, ctrMul: 1.45 },
      { id: "AD-TV-02", campaignId: "CMP-TT-VIRAL", name: "Duet challenge cut", adset: "Broad 18–34", format: "Video", status: "Active", weight: 0.33, ctrMul: 1.1 },
      { id: "AD-TV-03", campaignId: "CMP-TT-VIRAL", name: "Before/after beat drop", adset: "Creator LAL", format: "Video", status: "Active", weight: 0.23, ctrMul: 0.9 },
    ],
    updated: "18 min ago",
  },
  {
    id: "CMP-TT-CONV", clientId: "freebeat", name: "Freebeat — TikTok Install Test", channel: "TikTok Ads", objective: "Conversions", status: "Completed", geo: "United States",
    startDay: 10, endDay: 39, dailyBudget: 120, cpm: 5.8, ctr: 0.011, cvr: 0.03, aov: null, freq: 2.9, conversionsAvailable: false,
    countries: US, devices: [["Mobile", 0.95], ["Desktop", 0.03], ["Tablet", 0.02]],
    placements: [{ name: "TikTok Feed", share: 1, cpmMul: 1, freq: 2.9 }],
    ads: [
      { id: "AD-TC-01", campaignId: "CMP-TT-CONV", name: "Install hook v1", adset: "Broad", format: "Video", status: "Paused", weight: 0.55, ctrMul: 1.1 },
      { id: "AD-TC-02", campaignId: "CMP-TT-CONV", name: "Install hook v2", adset: "Broad", format: "Video", status: "Paused", weight: 0.45, ctrMul: 0.95 },
    ],
    updated: "Ended 50 days ago",
  },
  /* Demo Client B — smaller dataset so the client switcher stays coherent. */
  {
    id: "CMP-B-SEARCH", clientId: "clientb", name: "Client B — Always-on Search", channel: "Google Ads", objective: "Conversions", status: "Active", geo: "United States",
    startDay: 0, endDay: 89, dailyBudget: 105, cpm: 43.5, ctr: 0.052, cvr: 0.07, aov: 68, freq: 1.2, conversionsAvailable: true,
    countries: US, devices: [["Mobile", 0.5], ["Desktop", 0.42], ["Tablet", 0.08]],
    placements: [{ name: "Search", share: 1, cpmMul: 1, freq: 1.2 }],
    ads: [
      { id: "AD-BS-01", campaignId: "CMP-B-SEARCH", name: "Search ad copy set v4", adset: "Core terms", format: "Image", status: "Active", creativeId: "B-01", weight: 0.7, ctrMul: 1.2 },
      { id: "AD-BS-02", campaignId: "CMP-B-SEARCH", name: "Search ad copy set v5", adset: "Core terms", format: "Image", status: "Active", weight: 0.3, ctrMul: 0.9 },
    ],
    updated: "1 h ago",
  },
  {
    id: "CMP-B-RETARGET", clientId: "clientb", name: "Client B — Retargeting Q3", channel: "Meta", objective: "Conversions", status: "Paused", geo: "United States",
    startDay: 5, endDay: 55, dailyBudget: 40, cpm: 9.3, ctr: 0.016, cvr: 0.035, aov: 54, freq: 3.1, conversionsAvailable: true,
    countries: US, devices: DEVICE_STD,
    placements: [{ name: "Facebook Feed", share: 0.7, cpmMul: 1, freq: 3.4 }, { name: "Instagram Stories", share: 0.3, cpmMul: 0.9, freq: 2.5 }],
    ads: [
      { id: "AD-BR-01", campaignId: "CMP-B-RETARGET", name: "Retargeting carousel", adset: "Site visitors 30d", format: "Carousel", status: "Paused", creativeId: "B-02", weight: 1, ctrMul: 1 },
    ],
    updated: "Paused 34 days ago",
  },
];

export function campaignById(id: string): CampaignMeta | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

/* ------------------------- Daily row generation ------------------- */
export interface DayRow {
  day: number;
  campaignId: string;
  country: Country;
  device: Device;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  reach: number;
}

function buildRows(): DayRow[] {
  const rows: DayRow[] = [];
  for (const c of CAMPAIGNS) {
    const rng = rngFor(c.id);
    const phase = rng() * Math.PI * 2;
    const trend = 0.85 + rng() * 0.3; // slow drift over the flight
    for (let day = c.startDay; day <= c.endDay; day++) {
      const t = (day - c.startDay) / Math.max(1, c.endDay - c.startDay);
      const seasonal = 1 + 0.22 * Math.sin(day / 8.5 + phase) + (trend - 1) * t;
      const noise = 0.82 + rng() * 0.36;
      const spend = c.dailyBudget * seasonal * noise;
      const impressions = (spend / c.cpm) * 1000 * (0.9 + rng() * 0.2);
      const clicks = impressions * c.ctr * (0.85 + rng() * 0.3);
      const conversions = clicks * c.cvr * (0.8 + rng() * 0.4);
      const revenue = c.aov == null ? 0 : conversions * c.aov * (0.85 + rng() * 0.3);
      const reach = impressions / (c.freq * (0.9 + rng() * 0.2));

      // Split into country × device cells, then renormalize so the cells
      // sum exactly to the campaign-day totals (full reconciliation).
      const cells: { country: Country; device: Device; w: number }[] = [];
      let wSum = 0;
      for (const [country, cs] of c.countries) {
        for (const [device, ds] of c.devices) {
          const w = cs * ds * (0.8 + rng() * 0.4);
          cells.push({ country, device, w });
          wSum += w;
        }
      }
      for (const cell of cells) {
        const k = cell.w / wSum;
        rows.push({
          day, campaignId: c.id, country: cell.country, device: cell.device,
          spend: spend * k, impressions: impressions * k, clicks: clicks * k,
          conversions: conversions * k, revenue: revenue * k, reach: reach * k,
        });
      }
    }
  }
  return rows;
}
export const ROWS: DayRow[] = buildRows();

/* ------------------------- Filters (session store) ---------------- */
export interface AnalyticsFilters {
  days: number; // 7 | 30 | 90 | custom count
  compare: boolean;
  channel: Channel | "all";
  country: Country | "all";
  device: Device | "all";
  campaignId: string | "all";
  objective: Objective | "all";
  status: CampStatus | "all";
}
export const DEFAULT_FILTERS: AnalyticsFilters = {
  days: 30, compare: true, channel: "all", country: "all", device: "all", campaignId: "all", objective: "all", status: "all",
};

let filters: AnalyticsFilters = { ...DEFAULT_FILTERS };
const fListeners = new Set<() => void>();
export function useAnalyticsFilters(): AnalyticsFilters {
  return useSyncExternalStore(
    (l) => { fListeners.add(l); return () => fListeners.delete(l); },
    () => filters,
    () => DEFAULT_FILTERS,
  );
}
export function setAnalyticsFilters(patch: Partial<AnalyticsFilters>) {
  filters = { ...filters, ...patch };
  fListeners.forEach((l) => l());
}
export function resetAnalyticsFilters() {
  filters = { ...DEFAULT_FILTERS };
  fListeners.forEach((l) => l());
}
export function activeFilterCount(f: AnalyticsFilters): number {
  let n = 0;
  if (f.days !== DEFAULT_FILTERS.days) n++;
  if (!f.compare) n++;
  if (f.channel !== "all") n++;
  if (f.country !== "all") n++;
  if (f.device !== "all") n++;
  if (f.campaignId !== "all") n++;
  if (f.objective !== "all") n++;
  if (f.status !== "all") n++;
  return n;
}
export function rangeLabel(f: AnalyticsFilters): string {
  return `Last ${f.days} days`;
}

/* ------------------------- Aggregation ---------------------------- */
export interface Agg {
  spend: number; impressions: number; clicks: number; conversions: number; revenue: number; reach: number;
  ctr: number; cpc: number; cpm: number; cpa: number | null; roas: number | null; frequency: number;
  rows: number;
}
export function agg(rows: DayRow[]): Agg {
  let spend = 0, impressions = 0, clicks = 0, conversions = 0, revenue = 0, reach = 0;
  for (const r of rows) {
    spend += r.spend; impressions += r.impressions; clicks += r.clicks;
    conversions += r.conversions; revenue += r.revenue; reach += r.reach;
  }
  return {
    spend, impressions, clicks, conversions, revenue, reach,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpa: conversions > 0 ? spend / conversions : null,
    roas: spend > 0 && revenue > 0 ? revenue / spend : null,
    frequency: reach > 0 ? impressions / reach : 0,
    rows: rows.length,
  };
}

/** Campaigns matching the non-campaign filters (channel/objective/status) for a client scope. */
export function scopedCampaigns(clientIds: string[], f: AnalyticsFilters): CampaignMeta[] {
  return CAMPAIGNS.filter(
    (c) =>
      clientIds.includes(c.clientId) &&
      (f.channel === "all" || c.channel === f.channel) &&
      (f.objective === "all" || c.objective === f.objective) &&
      (f.status === "all" || c.status === f.status) &&
      (f.campaignId === "all" || c.id === f.campaignId),
  );
}

export function filteredRows(clientIds: string[], f: AnalyticsFilters, opts?: { previous?: boolean }): DayRow[] {
  const camps = new Set(scopedCampaigns(clientIds, f).map((c) => c.id));
  const hi = DAYS - 1;
  const lo = hi - f.days + 1;
  const shift = opts?.previous ? f.days : 0;
  return ROWS.filter(
    (r) =>
      camps.has(r.campaignId) &&
      r.day >= lo - shift &&
      r.day <= hi - shift &&
      (f.country === "all" || r.country === f.country) &&
      (f.device === "all" || r.device === f.device),
  );
}

export interface DailyPoint extends Agg { day: number; label: string }
export function dailySeries(rows: DayRow[], f: AnalyticsFilters, opts?: { previous?: boolean }): DailyPoint[] {
  const hi = DAYS - 1;
  const lo = hi - f.days + 1;
  const byDay = new Map<number, DayRow[]>();
  for (const r of rows) {
    const arr = byDay.get(r.day) ?? [];
    arr.push(r);
    byDay.set(r.day, arr);
  }
  const out: DailyPoint[] = [];
  for (let d = lo; d <= hi; d++) {
    const a = agg(byDay.get(d) ?? []);
    out.push({ ...a, day: d, label: dayLabel(d) });
  }
  return out;
}

export function groupAgg(rows: DayRow[], key: "country" | "device" | "campaignId"): { name: string; a: Agg }[] {
  const map = new Map<string, DayRow[]>();
  for (const r of rows) {
    const k = r[key];
    const arr = map.get(k) ?? [];
    arr.push(r);
    map.set(k, arr);
  }
  return [...map.entries()].map(([name, rs]) => ({ name, a: agg(rs) })).sort((x, y) => y.a.spend - x.a.spend);
}

export interface CampaignRow extends Agg { meta: CampaignMeta }
export function campaignTable(clientIds: string[], f: AnalyticsFilters): CampaignRow[] {
  const rows = filteredRows(clientIds, f);
  return scopedCampaigns(clientIds, f)
    .map((meta) => ({ meta, a: agg(rows.filter((r) => r.campaignId === meta.id)) }))
    .filter((r) => r.a.rows > 0)
    .map(({ meta, a }) => ({ ...a, meta }))
    .sort((x, y) => y.spend - x.spend);
}

/** Ad-level breakdown for one campaign under the current filters. */
export interface AdRow extends Agg { ad: AdMeta }
export function adBreakdown(campaignId: string, rows: DayRow[]): AdRow[] {
  const meta = campaignById(campaignId);
  if (!meta) return [];
  const campRows = rows.filter((r) => r.campaignId === campaignId);
  const total = agg(campRows);
  const weights = meta.ads.map((ad) => ad.weight * (0.85 + rngFor(ad.id)() * 0.3));
  const wSum = weights.reduce((a, b) => a + b, 0);
  return meta.ads
    .map((ad, i) => {
      const k = weights[i]! / wSum;
      const spend = total.spend * k;
      const impressions = total.impressions * k;
      const clicks = impressions * total.ctr / 100 * ad.ctrMul;
      const conversions = total.conversions * k;
      const revenue = total.revenue * k;
      const reach = total.reach * k;
      return {
        ad, spend, impressions, clicks, conversions, revenue, reach,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        cpa: conversions > 0 ? spend / conversions : null,
        roas: spend > 0 && revenue > 0 ? revenue / spend : null,
        frequency: reach > 0 ? impressions / reach : 0,
        rows: campRows.length,
      } satisfies AdRow;
    })
    .sort((x, y) => y.spend - x.spend);
}

/** Placement breakdown (Meta campaigns carry placement metadata). */
export interface PlacementRow { name: string; impressions: number; cpm: number; frequency: number; spend: number }
export function placementBreakdown(clientIds: string[], f: AnalyticsFilters): PlacementRow[] {
  const camps = scopedCampaigns(clientIds, f).filter((c) => c.channel === "Meta");
  const rows = filteredRows(clientIds, { ...f, channel: "Meta" });
  const total = agg(rows);
  const map = new Map<string, PlacementRow>();
  let shareSum = 0;
  for (const c of camps) for (const p of c.placements) shareSum += p.share;
  for (const c of camps) {
    const cRows = rows.filter((r) => r.campaignId === c.id);
    const cAgg = agg(cRows);
    for (const p of c.placements) {
      const imp = cAgg.impressions * p.share;
      const cur = map.get(p.name) ?? { name: p.name, impressions: 0, cpm: 0, frequency: 0, spend: 0 };
      cur.impressions += imp;
      cur.spend += imp * (c.cpm * p.cpmMul) / 1000;
      cur.frequency = cur.frequency + p.freq * p.share; // weighted approx
      map.set(p.name, cur);
    }
  }
  const out = [...map.values()];
  for (const p of out) {
    p.cpm = p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0;
    p.frequency = shareSum > 0 ? p.frequency / shareSum : 0;
  }
  void total;
  return out.sort((a, b) => b.impressions - a.impressions);
}

/* ------------------------- Insights ------------------------------- */
export interface Insight {
  id: string;
  category: "Opportunity" | "Warning" | "Creative" | "Budget" | "Data quality" | "Info";
  headline: string;
  evidence: string[];
  why: string;
  actionLabel: string;
  actionKind: "ua" | "creative" | "task" | "campaign";
  campaignId?: string;
  confidence: string;
}

export function computeInsights(clientIds: string[], f: AnalyticsFilters): Insight[] {
  const rows = filteredRows(clientIds, f);
  const total = agg(rows);
  const out: Insight[] = [];
  if (total.rows === 0) {
    return [{ id: "nodata", category: "Info", headline: "Needs more data", evidence: ["No delivery in the selected filter set."], why: "Insights are only generated when the filtered dataset has enough volume to support them.", actionLabel: "Reset filters", actionKind: "task", confidence: "No data" }];
  }

  // 1. Placement opportunity (Meta only)
  if (f.channel === "all" || f.channel === "Meta") {
    const pl = placementBreakdown(clientIds, f);
    const reels = pl.find((p) => p.name === "Instagram Reels");
    const feed = pl.find((p) => p.name === "Facebook Feed");
    if (reels && feed && reels.impressions > 500 && feed.impressions > 500 && reels.cpm < feed.cpm) {
      const delta = Math.round((1 - reels.cpm / feed.cpm) * 100);
      out.push({
        id: "reels-cpm", category: "Opportunity",
        headline: `Instagram Reels is delivering a ${delta}% lower CPM than Facebook Feed`,
        evidence: [`Reels CPM $${reels.cpm.toFixed(2)} vs Feed $${feed.cpm.toFixed(2)} (${rangeLabel(f)})`, `Reels frequency ${reels.frequency.toFixed(1)} vs Feed ${feed.frequency.toFixed(1)}`],
        why: "Cheaper, less-fatigued reach on Reels suggests headroom before saturation.",
        actionLabel: "Ask UA Agent", actionKind: "ua",
        confidence: "Medium — directional, based on demo delivery data",
      });
    }
  }

  // 2. Frequency warning: second half of range vs first half
  const mid = Math.floor(f.days / 2);
  const first = agg(rows.filter((r) => r.day < DAYS - 1 - mid));
  const second = agg(rows.filter((r) => r.day >= DAYS - 1 - mid));
  if (first.reach > 0 && second.frequency > first.frequency * 1.08) {
    const reachGrowth = first.reach > 0 ? ((second.reach - first.reach) / first.reach) * 100 : 0;
    out.push({
      id: "freq-rise", category: "Warning",
      headline: "Frequency is rising while reach growth is slowing",
      evidence: [`Frequency ${first.frequency.toFixed(2)} → ${second.frequency.toFixed(2)} across the period`, `Reach change between halves: ${reachGrowth >= 0 ? "+" : ""}${reachGrowth.toFixed(0)}%`],
      why: "Rising frequency with flat reach can indicate creative fatigue or audience saturation.",
      actionLabel: "Investigate", actionKind: "ua",
      confidence: "Medium — correlation only, not proof of fatigue",
    });
  }

  // 3. Creative opportunity: top ads by CTR vs account average
  const camps = scopedCampaigns(clientIds, f);
  const adRows = camps.flatMap((c) => adBreakdown(c.id, rows));
  const avgCtr = total.ctr;
  const top = adRows.filter((a) => a.impressions > 1000 && a.ctr > avgCtr * 1.3).sort((a, b) => b.ctr - a.ctr).slice(0, 2);
  if (top.length >= 2) {
    out.push({
      id: "top-creative", category: "Creative",
      headline: `${top.length} video ads are outperforming the account average CTR`,
      evidence: top.map((a) => `“${a.ad.name}” CTR ${a.ctr.toFixed(2)}% vs avg ${avgCtr.toFixed(2)}%`),
      why: "Understanding what these creatives have in common can inform the next production batch.",
      actionLabel: "Ask Creative Agent", actionKind: "creative",
      confidence: "High — consistent across the selected period",
    });
  }

  // 4. Budget concentration
  const table = campaignTable(clientIds, f).filter((c) => c.meta.conversionsAvailable && c.conversions > 0);
  if (table.length >= 2) {
    const topSpend = table[0]!;
    const share = total.spend > 0 ? (topSpend.spend / total.spend) * 100 : 0;
    const cpas = table.map((c) => c.cpa!).sort((a, b) => a - b);
    const median = cpas[Math.floor(cpas.length / 2)]!;
    if (share > 30 && topSpend.cpa != null && topSpend.cpa > median * 1.15) {
      out.push({
        id: "budget-conc", category: "Budget",
        headline: `“${topSpend.meta.name}” takes ${share.toFixed(0)}% of spend with above-median CPA`,
        evidence: [`Spend $${Math.round(topSpend.spend).toLocaleString()} (${share.toFixed(0)}% of filtered total)`, `CPA $${topSpend.cpa.toFixed(2)} vs median $${median.toFixed(2)}`],
        why: "A large budget share with weaker efficiency is worth a reallocation review — not an automatic change.",
        actionLabel: "Review campaign", actionKind: "campaign", campaignId: topSpend.meta.id,
        confidence: "Medium — compare like-for-like objectives before acting",
      });
    }
  }

  // 5. Data quality: channels without conversion tracking
  const noConv = scopedCampaigns(clientIds, f).filter((c) => !c.conversionsAvailable);
  if (noConv.length > 0 && (f.channel === "all" || f.channel === "TikTok Ads")) {
    out.push({
      id: "conv-missing", category: "Data quality",
      headline: "Conversion data is unavailable for the connected TikTok account",
      evidence: noConv.map((c) => `“${c.name}” — CPA / ROAS shown as N/A`),
      why: "Check the measurement setup before interpreting CPA or ROAS for TikTok campaigns.",
      actionLabel: "Create Task", actionKind: "task",
      confidence: "Certain — reporting limitation, not performance",
    });
  }

  if (out.length === 0) {
    out.push({ id: "thin", category: "Info", headline: "Needs more data", evidence: ["The current filter selection is too narrow for reliable findings."], why: "Widen the date range or clear a filter to unlock insights.", actionLabel: "Clear filters", actionKind: "task", confidence: "Insufficient data" });
  }
  return out.slice(0, 5);
}

/* ------------------------- CSV export ----------------------------- */
export function campaignCsv(clientIds: string[], f: AnalyticsFilters): string {
  const table = campaignTable(clientIds, f);
  const header = ["Campaign", "Channel", "Objective", "Status", "Geo", "Spend", "Impressions", "Reach", "Clicks", "CTR %", "CPC", "CPM", "Conversions", "CPA", "Revenue", "ROAS", "Frequency"];
  const lines = table.map((r) => [
    r.meta.name, r.meta.channel, r.meta.objective, r.meta.status, r.meta.geo,
    r.spend.toFixed(2), Math.round(r.impressions), Math.round(r.reach), Math.round(r.clicks),
    r.ctr.toFixed(2), r.cpc.toFixed(2), r.cpm.toFixed(2),
    Math.round(r.conversions), r.cpa == null ? "N/A" : r.cpa.toFixed(2),
    Math.round(r.revenue), r.roas == null ? "N/A" : r.roas.toFixed(2), r.frequency.toFixed(2),
  ]);
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...lines].map((l) => l.map(esc).join(",")).join("\n");
}

/* ------------------------- Formatting ----------------------------- */
export const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
export const fmtNum = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toLocaleString());
export const fmtPct = (n: number) => `${n.toFixed(2)}%`;
export function fmtDelta(cur: number, prev: number): { text: string; up: boolean } | null {
  if (!(prev > 0)) return null;
  const d = ((cur - prev) / prev) * 100;
  return { text: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`, up: d >= 0 };
}
