import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type Role = "admin" | "member" | "ops" | "client";
export type Biz = "bluefocus" | "direct";
export type AccessPath = "self" | "bd";
export type CampaignStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "submitted"
  | "ops_review"
  | "provider_accepted"
  | "delivery_pending"
  | "live_verified";
export type TaskStatus = "running" | "waiting_approval" | "blocked" | "completed" | "failed";
export type CaseStatus = "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
export type PageAccess = "required" | "pending_support" | "connected";

export interface Client {
  id: string;
  name: string;
  biz: Biz;
  industry: string;
  tagline: string;
}
export interface Brand {
  name: string;
  description: string;
  industry: string;
  audience: string;
  market: string;
  url: string;
  assets: string[];
  status: "draft" | "confirmed";
  source: "ai" | "bd" | "manual";
}
export interface LogEntry {
  stage: string;
  agent: string;
  checked: string;
  data: string;
  tool: string;
  result: string;
  next: string;
}
export interface Task {
  id: string;
  clientId: string;
  title: string;
  agent: string;
  status: TaskStatus;
  stage: number;
  stages: LogEntry[];
  campaignId?: string;
  caseId?: string;
  result?: string | undefined;
  createdAt: string;
}
export interface Revision {
  rev: number;
  by: string;
  change: string;
}
export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  platform: string;
  objective: string;
  geo: string;
  dailyBudget: number;
  totalCap: number;
  audience: string;
  placements: string[];
  assets: number;
  revision: number;
  status: CampaignStatus;
  approvedRevision: number | null;
  changesRequested?: string | undefined;
  revisions: Revision[];
}
export interface Case {
  id: string;
  clientId: string;
  type: "Meta Page Authorization" | "Account Opening";
  owner: string;
  taskId: string;
  status: CaseStatus;
  updated: string;
  diagnostics: string[];
  notes: string[];
  recheck?: string;
}
export type PersonId = "sarah" | "alex" | "david" | "bfa";
export type MsgFrom = "user" | "clayton" | "ua" | "creative" | "system" | "aiam" | PersonId;
export type MsgCard = "stages" | "proposal" | "readiness" | "report" | "resume" | "progress" | "analysis" | "brief" | "summary";
export interface Msg {
  id: string;
  clientId: string;
  from: MsgFrom;
  text: string;
  at: string;
  card?: MsgCard | undefined;
  mentions?: string[] | undefined;
  taskId?: string | undefined;
}
export interface Brief {
  id: string;
  clientId: string;
  taskId: string;
  title: string;
  revision: number;
  concepts: string[];
  note: string;
  status: "draft" | "approved_internal" | "shared";
}
export interface Notif {
  id: string;
  text: string;
  to: string;
  read: boolean;
}

/** Agency performance report built from the Analytics dashboard. */
export interface PerfReport {
  id: string;
  clientId: string;
  title: string;
  rangeLabel: string;
  narrative: string;
  charts: string[];
  comment: string;
  metrics: { label: string; value: string }[];
  insights: string[];
  status: "draft" | "ready" | "published";
  createdBy: string;
  createdAt: string;
}

export interface State {
  version: number;
  accessPath: AccessPath;
  role: Role;
  biz: Biz;
  clientId: string; // "all" or a client id
  person: PersonId; // active human when role is admin/member
  onboarded: boolean;
  onboarding: {
    step: number;
    goal?: string | undefined;
    freeText: string;
    customerType?: "own" | "agency" | undefined;
    company: string;
    clientName: string;
    url: string;
    objective: string;
    channel: string;
  };
  clients: Client[];
  brands: Record<string, Brand>;
  pageAccess: PageAccess;
  wallet: { balance: number; activity: { id: string; text: string; amount: number; by: string }[] };
  tasks: Task[];
  campaign: Campaign | null;
  briefs: Brief[];
  collab: { step: number };
  resumed: boolean;
  launch: {
    inFlight: boolean;
    requestId: string | null;
    dupBlocked: number;
    error: string | null;
    failNext: boolean;
    providerId: string;
    firstSpend: number | null;
  };
  cases: Case[];
  report: { status: "none" | "draft" | "ready" | "published"; external: string };
  perfReports: PerfReport[];
  messages: Msg[];
  notifications: Notif[];
  checks: string[];
  clientAiAm: boolean;
  creativeLevel: "limited" | "enabled";
  portalActions: { id: string; text: string; done: boolean }[];
  portalRequests: string[];
  slackReplies: string[];
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Static demo data                                                    */
/* ------------------------------------------------------------------ */
export const USERS: Record<Role, { name: string; title: string; initials: string }> = {
  admin: { name: "Maya Chen", title: "BlueFocus Admin", initials: "MC" },
  member: { name: "Sarah Linden", title: "BlueFocus Member", initials: "SL" },
  ops: { name: "Priya Nair", title: "Hellyeah Ops", initials: "PN" },
  client: { name: "Sam Rivera", title: "Freebeat End Client", initials: "SR" },
};

export interface Person {
  id: PersonId;
  name: string;
  full: string;
  title: string;
  initials: string;
  role: "admin" | "member";
}
export const PEOPLE: Person[] = [
  { id: "sarah", name: "Sarah", full: "Sarah Linden", title: "Account Manager", initials: "SL", role: "member" },
  { id: "alex", name: "Alex", full: "Alex Rivera", title: "Media Buyer · UA Specialist", initials: "AR", role: "member" },
  { id: "david", name: "David", full: "David Kim", title: "Creative Strategist", initials: "DK", role: "member" },
  { id: "bfa", name: "BlueFocus Admin", full: "Maya Chen", title: "BlueFocus Admin", initials: "MC", role: "admin" },
];
export const AI_TEAM = [
  { id: "clayton", name: "Clayton", title: "AI Team Lead" },
  { id: "ua", name: "UA Agent", title: "Campaign Specialist" },
  { id: "creative", name: "Creative Agent", title: "Creative Specialist" },
] as const;
export type AiId = (typeof AI_TEAM)[number]["id"];
export const MENTIONABLES: { id: string; label: string; kind: "human" | "ai" }[] = [
  ...AI_TEAM.map((a) => ({ id: a.id as string, label: a.name, kind: "ai" as const })),
  ...PEOPLE.map((p) => ({ id: p.id as string, label: p.id === "bfa" ? "BlueFocus Admin" : p.name, kind: "human" as const })),
];

/** The human currently acting, when the role is an agency role. */
export function personFor(s: State): Person | null {
  if (s.role !== "admin" && s.role !== "member") return null;
  return PEOPLE.find((p) => p.id === s.person) ?? PEOPLE[0]!;
}
export function actorName(s: State): string {
  return personFor(s)?.full ?? USERS[s.role].name;
}

export const FREEBEAT_BRAND: Brand = {
  name: "Freebeat",
  description: "AI music-video app that turns any track into a beat-synced short video in seconds.",
  industry: "Consumer apps · Music & creator tools",
  audience: "Creators and music fans aged 18–34 who post short-form video",
  market: "United States (primary), English-speaking markets",
  url: "freebeat.ai",
  assets: ["Logo (SVG)", "Brand colors: Electric violet / Black", "3 approved launch videos"],
  status: "draft",
  source: "bd",
};

export const STATIC_CAMPAIGNS = [
  { id: "CMP-FB-SPRING", clientId: "freebeat", name: "Freebeat — Spring Launch (ended)", platform: "Meta", status: "Completed", spend: 4120, impressions: 580_281, cpm: 7.1, freq: 1.9 },
  { id: "CMP-B-SEARCH", clientId: "clientb", name: "Client B — Always-on Search", platform: "Google Ads", status: "Live (demo)", spend: 9310, impressions: 214_000, cpm: 43.5, freq: 1.2 },
  { id: "CMP-B-RETARGET", clientId: "clientb", name: "Client B — Retargeting Q3", platform: "Meta", status: "Paused", spend: 1880, impressions: 201_400, cpm: 9.33, freq: 3.1 },
  { id: "CMP-DIR-LOCAL", clientId: "direct", name: "Northwind — Local Awareness", platform: "Meta", status: "Draft idea", spend: 0, impressions: 0, cpm: 0, freq: 0 },
];

export const CREATIVES = [
  { id: "A-01", clientId: "freebeat", name: "“Drop the beat” 15s vertical", kind: "Video · 9:16", status: "Approved" },
  { id: "A-02", clientId: "freebeat", name: "Creator remix montage 30s", kind: "Video · 9:16", status: "Approved" },
  { id: "A-03", clientId: "freebeat", name: "“Any song → video” static", kind: "Image · 1:1", status: "Approved" },
  { id: "A-04", clientId: "freebeat", name: "Holiday teaser (concept)", kind: "Image · 4:5", status: "Internal draft" },
  { id: "B-01", clientId: "clientb", name: "Search ad copy set v4", kind: "Text", status: "Approved" },
  { id: "B-02", clientId: "clientb", name: "Retargeting carousel", kind: "Carousel", status: "Approved" },
  { id: "D-01", clientId: "direct", name: "Morning brew hero", kind: "Image · 1:1", status: "Approved" },
];

export const MAIN_TASK_ID = "T-1024";
export const MAIN_PROMPT =
  "@Clayton, can you review Freebeat's Meta performance over the last seven days and prepare recommendations for our next creative batch?";

/** UA demo analysis numbers, shown on the Performance Analysis Card. */
export const UA_ANALYSIS = {
  window: "Last 7 days · demo data",
  freshness: "Updated 12 min ago (demo)",
  spend: 1840,
  cpm: 6.4,
  feedFreq: 2.8,
  reelsCpmDelta: "-18% vs Feed",
  rows: [
    ["Placement", "CPM", "Frequency", "Note"],
    ["Instagram Reels", "$5.90", "1.6", "Most efficient delivery"],
    ["Facebook Feed", "$7.20", "2.8", "Frequency relatively high"],
    ["Instagram Stories", "$6.80", "1.9", "Stable"],
  ],
};

const COLLAB_STAGES: LogEntry[] = [
  { stage: "Validating client context", agent: "Clayton", checked: "Request scope & client context", data: "Client: Freebeat · Channel: Meta · Window: last 7 days", tool: "Clayton task planner", result: "Context confirmed; T-1024 created", next: "Load campaign data" },
  { stage: "Loading demo campaign data", agent: "UA Agent", checked: "Meta campaign data access", data: "Last 7 days · spend, impressions, placements (demo)", tool: "Meta reporting (simulated read)", result: "Demo data loaded", next: "Review metrics" },
  { stage: "Reviewing campaign metrics", agent: "UA Agent", checked: "Spend, CPM, frequency, placement performance", data: "Feed frequency high; Reels most efficient", tool: "UA analyzer (simulated)", result: "Findings + placement breakdown prepared", next: "Brief Creative" },
  { stage: "Preparing creative concepts", agent: "Creative Agent", checked: "Approved brand assets only", data: "3 approved assets; bulk generation off", tool: "Creative capability (existing assets)", result: "3 concepts drafted (Brief Rev 1)", next: "Human feedback" },
  { stage: "Revising creative brief", agent: "Creative Agent", checked: "David's feedback on the UGC concept", data: "Revision 1 → 2", tool: "Creative capability", result: "Brief Rev 2: creator-led UGC", next: "Summarize" },
  { stage: "Summarizing for human review", agent: "Clayton", checked: "Deliverables & open decisions", data: "Performance analysis + Brief Rev 2", tool: "Clayton summarizer", result: "Summary posted; human review required", next: "Internal approval" },
];

const GENERIC_STAGES = (label: string, agent: string): LogEntry[] => [
  { stage: "Understanding request", agent: "Clayton", checked: "Request scope", data: label, tool: "Clayton task planner", result: "Plan created", next: "Gather data" },
  { stage: "Gathering data", agent, checked: "Recent campaign & brand data", data: "Last 7 days (demo data)", tool: `${agent} (simulated)`, result: "Data collected", next: "Summarize" },
  { stage: "Summarizing findings", agent, checked: "Findings", data: "3 observations", tool: `${agent} summarizer`, result: "Summary ready for review", next: "Review in workspace" },
];

/* ------------------------------------------------------------------ */
/* Initial state                                                       */
/* ------------------------------------------------------------------ */
function baseState(accessPath: AccessPath): State {
  const bd = accessPath === "bd";
  return {
    version: 4,
    accessPath,
    role: "admin",
    biz: "bluefocus",
    clientId: "freebeat",
    person: "bfa",
    onboarded: false,
    onboarding: {
      step: 0,
      freeText: "",
      company: "BlueFocus",
      clientName: "Freebeat",
      url: "freebeat.ai",
      objective: "Awareness",
      channel: "Meta Ads",
    },
    clients: [
      { id: "freebeat", name: "Freebeat", biz: "bluefocus", industry: "Music & creator app", tagline: "AI music videos" },
      { id: "clientb", name: "Demo Client B", biz: "bluefocus", industry: "Skincare e-commerce", tagline: "DTC skincare" },
      { id: "direct", name: "Northwind Coffee", biz: "direct", industry: "Local F&B", tagline: "Direct customer" },
    ],
    brands: {
      ...(bd ? { freebeat: { ...FREEBEAT_BRAND } } : {}),
      clientb: { name: "Demo Client B", description: "DTC skincare brand selling clean daily routines online.", industry: "Beauty · E-commerce", audience: "Women 25–44 in urban US", market: "United States", url: "clientb.example", assets: ["Logo", "Product photography set"], status: "confirmed", source: "manual" },
      direct: { name: "Northwind Coffee", description: "Neighborhood specialty coffee roaster with 3 cafés.", industry: "Food & beverage", audience: "Local commuters and remote workers", market: "Seattle, WA", url: "northwind.example", assets: ["Logo"], status: "confirmed", source: "manual" },
    },
    pageAccess: "required",
    wallet: { balance: 0, activity: [] },
    tasks: [
      { id: "T-0991", clientId: "clientb", title: "Weekly search performance review", agent: "UA Agent", status: "completed", stage: 3, stages: GENERIC_STAGES("Weekly search review", "UA Agent"), result: "CPC down 6% WoW (demo). No action needed.", createdAt: "Mon 09:10" },
      { id: "T-0997", clientId: "clientb", title: "Retargeting creative refresh research", agent: "Creative Agent", status: "failed", stage: 1, stages: GENERIC_STAGES("Creative research", "Creative Agent"), result: "Simulated failure: competitor ad library timed out. Retry available.", createdAt: "Mon 11:42" },
      { id: "T-1003", clientId: "direct", title: "Local awareness idea for Northwind", agent: "AI AM", status: "completed", stage: 3, stages: GENERIC_STAGES("Local awareness idea", "AI AM"), result: "Suggested a 3km radius Meta campaign (draft idea).", createdAt: "Sun 16:20" },
    ],
    campaign: null,
    briefs: [],
    collab: { step: 0 },
    resumed: false,
    launch: { inFlight: false, requestId: null, dupBlocked: 0, error: null, failNext: false, providerId: "DEMO-META-1024", firstSpend: null },
    cases: [
      { id: "CASE-2038", clientId: "clientb", type: "Account Opening", owner: "Anita", taskId: "T-0997", status: "In Progress", updated: "Mon 12:05", diagnostics: ["New TikTok ad account requested", "Business verification document pending", "No credentials stored in case"], notes: ["Requested business registration from agency AM."] },
    ],
    report: { status: "none", external: "" },
    messages: [
      { id: "M-1", clientId: "clientb", from: "sarah", text: "@Clayton, is the weekly search review for Demo Client B ready?", at: "Mon 09:05", mentions: ["clayton"] },
      { id: "M-2", clientId: "clientb", from: "clayton", text: "Yes — UA finished the weekly review: CPC is down 6% WoW (demo data), no action needed. The full summary is on the Tasks page under T-0991.", at: "Mon 09:12", taskId: "T-0991" },
    ],
    notifications: bd
      ? [{ id: "N-1", text: "BD team pre-configured BlueFocus / Freebeat. Please review the prefilled setup.", to: "/", read: false }]
      : [],
    checks: [],
    clientAiAm: false,
    creativeLevel: "limited",
    portalActions: [
      { id: "PA-1", text: "Confirm US holiday blackout dates", done: false },
      { id: "PA-2", text: "Acknowledge awareness campaign plan", done: false },
    ],
    portalRequests: [],
    slackReplies: [],
    seq: 10,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
const KEY = "hellyeah-prototype-state-v3";
const serverState = baseState("self");
let state: State = serverState;
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
}
export function hydrateDemo() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === serverState.version) {
        state = parsed;
        emit();
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}
export function useDemo(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverState,
  );
}
export function getDemo() {
  return state;
}
export function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  emit();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function id(s: State, p: string) {
  s.seq += 1;
  return `${p}-${s.seq}`;
}
export function notify(s: State, text: string, to = "/overview") {
  s.notifications.unshift({ id: id(s, "N"), text, to, read: false });
}
export function check(s: State, c: string) {
  if (!s.checks.includes(c)) s.checks.push(c);
}
function say(s: State, from: MsgFrom, text: string, card?: MsgCard, clientId = "freebeat", extra?: { mentions?: string[]; taskId?: string }) {
  s.messages.push({ id: id(s, "M"), clientId, from, text, at: now(), card, mentions: extra?.mentions, taskId: extra?.taskId });
}
export function ownerFor(type: Case["type"]) {
  return type === "Meta Page Authorization" ? "Andy" : "Anita";
}
export function parseMentions(text: string): string[] {
  return MENTIONABLES.filter((m) => text.includes(`@${m.label}`)).map((m) => m.id);
}
export function channelName(s: State, clientId: string): string {
  if (clientId === "freebeat") return "freebeat-growth";
  const c = s.clients.find((x) => x.id === clientId);
  return (c?.name ?? clientId).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || clientId;
}

export const can = {
  editDraft: (r: Role) => r === "admin" || r === "member",
  approve: (r: Role) => r === "admin",
  fund: (r: Role) => r === "admin",
  launch: (r: Role) => r === "admin",
  ops: (r: Role) => r === "ops",
  agency: (r: Role) => r === "admin" || r === "member" || r === "ops",
};

export function brandFor(s: State, clientId: string): Brand | undefined {
  return s.brands[clientId];
}

export function readiness(s: State) {
  const brand = s.brands["freebeat"];
  const daily = s.campaign?.dailyBudget ?? 200;
  return [
    { key: "brand", label: "Brand Profile", ok: brand?.status === "confirmed", value: brand ? (brand.status === "confirmed" ? "Confirmed" : "Draft — needs confirmation") : "Missing" },
    { key: "account", label: "Meta Ad Account", ok: true, value: "Assigned · act_DEMO_88231" },
    { key: "page", label: "Meta Page Access", ok: s.pageAccess === "connected", value: s.pageAccess === "connected" ? "Connected (verified)" : s.pageAccess === "pending_support" ? "Waiting for Support" : "Authorization Required" },
    { key: "wallet", label: "Wallet", ok: s.wallet.balance >= daily, value: s.wallet.balance >= daily ? `Funded · $${s.wallet.balance.toLocaleString()}` : `Funding Required (min $${daily})` },
    { key: "creative", label: "Creative Assets", ok: true, value: "Ready · 3 approved" },
  ];
}
export function isReady(s: State) {
  return readiness(s).every((r) => r.ok);
}

/** Main task status is derived from the shared campaign / access state so every screen agrees. */
export function mainTaskView(s: State): { status: TaskStatus; detail: string } | null {
  const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
  if (!t) return null;
  const c = s.campaign;
  if (c?.status === "live_verified") return { status: "completed", detail: "Campaign Live Verified" };
  if (s.launch.error) return { status: "failed", detail: s.launch.error };
  if (c) {
    if (s.pageAccess === "pending_support") return { status: "blocked", detail: "Waiting for Support · Meta Page access" };
    if (s.pageAccess === "required") return { status: "blocked", detail: "Meta Page authorization required" };
    if (!s.resumed) return { status: "blocked", detail: "Access verified — ready to resume" };
    if (c.status === "awaiting_approval") return { status: "waiting_approval", detail: `Waiting for Admin approval · Rev ${c.revision}` };
    if (c.status === "draft") return { status: "waiting_approval", detail: c.changesRequested ? "Changes requested by Admin" : "Draft ready — submit for approval" };
    if (c.status === "approved") return { status: "running", detail: isReady(s) ? "Approved — ready to launch" : "Approved — readiness incomplete" };
    return { status: "running", detail: `Launch: ${STATUS_LABEL[c.status]}` };
  }
  if (t.stage < t.stages.length) return { status: "running", detail: `Step ${t.stage}/${t.stages.length} · ${t.stages[t.stage - 1]?.stage ?? t.stages[0]?.stage ?? ""}` };
  return { status: t.status, detail: t.result ?? "" };
}
export function taskView(s: State, t: Task) {
  if (t.id === MAIN_TASK_ID) return mainTaskView(s)!;
  return { status: t.status, detail: t.status === "running" ? `Stage ${t.stage + 1}/${t.stages.length}` : t.result ?? "" };
}

export const STATUS_FLOW: CampaignStatus[] = ["draft", "awaiting_approval", "approved", "submitted", "ops_review", "provider_accepted", "delivery_pending", "live_verified"];
export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  submitted: "Submitted",
  ops_review: "Ops Review",
  provider_accepted: "Provider Accepted",
  delivery_pending: "Delivery Pending",
  live_verified: "Live Verified",
};

/** Coherent demo metrics: CPM = spend/impressions*1000, frequency = impressions/reach. */
export const REPORT_METRICS = { spend: 18.42, impressions: 3070, reach: 2558, cpm: 6.0, frequency: 1.2, freshness: "Updated 42 min ago (demo)" };
export const DEFAULT_EXTERNAL =
  "Your US awareness campaign is now live on Meta. In the first hours it reached 2,558 people at a $6.00 CPM, which is below the Spring Launch average. We'll keep frequency under 2.0 and share a full readout after 7 days.";

/* ------------------------------------------------------------------ */
/* Collaboration scenario (Freebeat shared channel)                    */
/* ------------------------------------------------------------------ */
function collabTask(s: State) {
  return s.tasks.find((t) => t.id === MAIN_TASK_ID);
}
function collabBrief(s: State) {
  return s.briefs.find((b) => b.taskId === MAIN_TASK_ID);
}
function setStage(s: State, n: number) {
  const t = collabTask(s);
  if (t && t.stage < n) t.stage = n;
}

/** Step 1 — a human asks Clayton; Clayton acknowledges and creates T-1024. */
function collabStart(s: State, from: PersonId, text?: string) {
  if (collabTask(s)) return; // no duplicate tasks
  const p = PEOPLE.find((x) => x.id === from) ?? PEOPLE[0]!;
  s.person = p.id;
  s.role = p.role;
  say(s, p.id, text ?? MAIN_PROMPT, undefined, "freebeat", { mentions: ["clayton"] });
  s.tasks.unshift({ id: MAIN_TASK_ID, clientId: "freebeat", title: "Freebeat Campaign Review & Creative Planning", agent: "Clayton → UA, Creative", status: "running", stage: 1, stages: COLLAB_STAGES, campaignId: "CMP-FB-US-01", createdAt: now() });
  say(s, "clayton", "Sure. I'll ask UA to review the recent campaign performance, then have Creative develop ideas based on what we find. Tracking this as T-1024.", undefined, "freebeat", { taskId: MAIN_TASK_ID });
  s.collab.step = Math.max(s.collab.step, 1);
  check(s, "c19");
  notify(s, "T-1024 created: Freebeat Campaign Review & Creative Planning.", "/tasks");
}

/** Advance the guided collaboration demo one step. */
function collabAdvance(s: State) {
  const step = s.collab.step;
  if (step === 0) {
    collabStart(s, "sarah");
    return;
  }
  const t = collabTask(s);
  if (!t) return;
  if (step === 1) {
    say(s, "clayton", "@UA Agent, please review Freebeat's last seven days of Meta performance, including spend, CPM, frequency and placement performance.", undefined, "freebeat", { mentions: ["ua"], taskId: MAIN_TASK_ID });
    say(s, "ua", "UA Agent is analyzing campaign performance…", "progress", "freebeat", { taskId: MAIN_TASK_ID });
    setStage(s, 2);
    s.collab.step = 2;
  } else if (step === 2) {
    say(s, "ua", "Analysis complete. Based on the demo campaign data, Feed frequency is relatively high and Reels is showing more efficient delivery. I've prepared a placement breakdown and recommendations.", "analysis", "freebeat", { taskId: MAIN_TASK_ID });
    setStage(s, 3);
    s.collab.step = 3;
    check(s, "c20");
  } else if (step === 3) {
    say(s, "clayton", "@Creative Agent, based on UA's findings, prepare three short-form creative concepts for Reels. Use Freebeat's approved brand assets.", undefined, "freebeat", { mentions: ["creative"], taskId: MAIN_TASK_ID });
    say(s, "creative", "Creative Agent is drafting concepts…", "progress", "freebeat", { taskId: MAIN_TASK_ID });
    setStage(s, 4);
    s.collab.step = 4;
  } else if (step === 4) {
    s.briefs.unshift({ id: "CB-101", clientId: "freebeat", taskId: MAIN_TASK_ID, title: "Freebeat Reels Concepts — Creative Brief", revision: 1, concepts: ["UGC Product Demo", "Fitness Routine Integration", "Problem/Solution Hook"], note: "Rev 1: initial concepts from UA's placement findings.", status: "draft" });
    say(s, "creative", "I've prepared three directions: UGC Product Demo, Fitness Routine Integration, and Problem/Solution Hook. Brief CB-101 is attached.", "brief", "freebeat", { taskId: MAIN_TASK_ID });
    setStage(s, 5);
    s.collab.step = 5;
  } else if (step === 5) {
    s.person = "david";
    s.role = "member";
    say(s, "david", "I like the UGC direction, but it still feels a bit too much like an ad. @Creative Agent, can you make it more natural and creator-led?", undefined, "freebeat", { mentions: ["creative"], taskId: MAIN_TASK_ID });
    collabRevise(s);
    s.collab.step = 6;
  } else if (step === 6) {
    s.person = "alex";
    s.role = "member";
    say(s, "alex", "@UA Agent, do you think we should narrow the targeting for the next test, or leave it broad?", undefined, "freebeat", { mentions: ["ua"], taskId: MAIN_TASK_ID });
    say(s, "ua", "Based on the demo data — Observation: broad 18–34 targeting delivered Reels CPM 18% below Feed with stable frequency. Recommendation: keep targeting broad for the next test and let placement optimization do the work; revisit narrowing only if frequency passes 3.0. Not yet executed: no targeting changes have been applied.", undefined, "freebeat", { taskId: MAIN_TASK_ID });
    s.collab.step = 7;
  } else if (step === 7) {
    s.person = "sarah";
    s.role = "member";
    t.stage = t.stages.length;
    t.status = "waiting_approval";
    t.result = "Awaiting internal review";
    say(s, "clayton", "We've completed the performance review and revised creative directions. Here's the summary and what still needs a human decision.", "summary", "freebeat", { taskId: MAIN_TASK_ID });
    s.collab.step = 8;
  } else if (step === 8) {
    approveInternal(s);
    s.collab.step = 9;
  }
}

/** Creative brief Revision 1 → 2 (David's feedback). */
function collabRevise(s: State) {
  const b = collabBrief(s);
  if (!b || b.revision >= 2) return;
  b.revision = 2;
  b.note = "Rev 2: UGC Product Demo reworked to be creator-led — handheld framing, native captions, no polished brand-ad feel. Other directions unchanged.";
  say(s, "creative", "Updated brief CB-101 to Revision 2: the UGC Product Demo concept is now creator-led — handheld framing, native captions, no brand polish. The other two directions are unchanged.", "brief", "freebeat", { taskId: MAIN_TASK_ID });
  notify(s, "Brief CB-101 updated to Revision 2.", "/creative");
}

/** Sarah approves the internal deliverable — nothing is shared with the end client. */
function approveInternal(s: State) {
  const t = collabTask(s);
  const b = collabBrief(s);
  if (!t || t.status === "completed") return;
  if (b) b.status = "approved_internal";
  t.status = "completed";
  t.result = `Internal deliverables approved by ${actorName(s)}`;
  say(s, "system", `${actorName(s)} approved the internal deliverables (analysis + Brief CB-101 Rev ${b?.revision ?? 1}). Nothing has been shared with Freebeat yet.`, undefined, "freebeat", { taskId: MAIN_TASK_ID });
  check(s, "c22");
  notify(s, "T-1024 internal deliverables approved.", "/tasks");
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */
export const actions = {
  reset(path?: AccessPath) {
    update((s) => {
      const keep = path ?? s.accessPath;
      Object.assign(s, baseState(keep));
    });
  },
  setAccessPath(p: AccessPath) {
    update((s) => Object.assign(s, baseState(p)));
  },
  setRole(r: Role) {
    update((s) => {
      s.role = r;
      if (r === "admin") s.person = "bfa";
      if (r === "member") s.person = "sarah";
      if (r === "client") {
        s.biz = "bluefocus";
        s.clientId = "freebeat";
        check(s, "c16");
      }
    });
  },
  setPerson(p: PersonId) {
    update((s) => {
      const person = PEOPLE.find((x) => x.id === p);
      if (!person) return;
      s.person = p;
      s.role = person.role;
      if (s.biz === "direct") {
        s.biz = "bluefocus";
        s.clientId = "freebeat";
      }
    });
  },
  setContext(ctx: "freebeat" | "clientb" | "direct") {
    update((s) => {
      s.biz = ctx === "direct" ? "direct" : "bluefocus";
      if (s.clientId === "freebeat" && ctx === "clientb") check(s, "c3");
      s.clientId = ctx;
    });
  },
  setClient(cid: string) {
    update((s) => {
      if (s.clientId !== cid && cid !== "all") check(s, "c3");
      s.clientId = cid;
    });
  },
  addClient(name: string) {
    update((s) => {
      const cid = `client-${s.seq + 1}`;
      s.seq += 1;
      s.clients.push({ id: cid, name, biz: "bluefocus", industry: "Not set", tagline: "New client (demo)" });
      s.clientId = cid;
      notify(s, `Client “${name}” added to BlueFocus (simulated).`, "/brand");
    });
  },
  onboarding(patch: Partial<State["onboarding"]>) {
    update((s) => Object.assign(s.onboarding, patch));
  },
  setBrand(cid: string, b: Brand) {
    update((s) => {
      s.brands[cid] = b;
    });
  },
  confirmBrand(cid: string, b?: Brand) {
    update((s) => {
      const brand = b ?? s.brands[cid];
      if (!brand) return;
      s.brands[cid] = { ...brand, status: "confirmed" };
      if (brand.source === "bd") check(s, "c1");
      notify(s, `${brand.name} Brand Profile confirmed.`, "/brand");
    });
  },
  finishOnboarding() {
    update((s) => {
      s.onboarded = true;
      const o = s.onboarding;
      if (o.customerType === "own") {
        s.biz = "direct";
        s.clientId = "direct";
      } else {
        s.biz = "bluefocus";
        s.clientId = "freebeat";
        const fb = s.clients.find((c) => c.id === "freebeat");
        if (fb && o.clientName.trim()) fb.name = o.clientName.trim();
      }
      if (s.accessPath === "self") check(s, "c2");
      notify(s, "Onboarding complete. Your AI team is ready.", "/workspace");
    });
  },

  /* ---------------- Shared channel ---------------- */
  /** Send a message in the current client channel, routing @mentions. */
  sendChannelMessage(cid: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    update((s) => {
      if (!can.agency(s.role)) return;
      const mentions = parseMentions(trimmed);
      const p = personFor(s);
      const from: MsgFrom = p?.id ?? "user";
      const aiMentioned: string[] = mentions.filter((m) => m === "clayton" || m === "ua" || m === "creative");
      const humansMentioned: string[] = mentions.filter((m) => !aiMentioned.includes(m));

      if (cid === "freebeat" && mentions.includes("clayton") && !collabTask(s)) {
        collabStart(s, p?.id ?? "sarah", trimmed);
        return;
      }
      say(s, from, trimmed, undefined, cid, { mentions });

      // Human-to-human mentions: notification only, never an AI task.
      for (const h of humansMentioned) {
        const person = PEOPLE.find((x) => x.id === h);
        if (person) notify(s, `${p?.full ?? "A teammate"} mentioned ${person.full} in #${channelName(s, cid)}. No AI task was created.`, "/workspace");
      }
      if (humansMentioned.length > 0 && aiMentioned.length === 0) {
        check(s, "c21");
        return;
      }

      // Direct specialist mentions (Clayton not required).
      const specialist = aiMentioned.find((m) => m === "ua" || m === "creative") as "ua" | "creative" | undefined;
      if (specialist) {
        const brief = s.briefs.find((b) => b.clientId === cid && b.taskId === MAIN_TASK_ID);
        if (specialist === "creative" && brief && /ugc|natural|creator|revise|revision/i.test(trimmed)) {
          collabRevise(s);
          return;
        }
        const agentName = specialist === "ua" ? "UA Agent" : "Creative Agent";
        const title = trimmed.length > 48 ? trimmed.slice(0, 48) + "…" : trimmed;
        // No duplicate tasks for the same running request.
        if (s.tasks.some((t) => t.clientId === cid && t.title === title && t.status === "running")) return;
        s.tasks.unshift({ id: id(s, "T"), clientId: cid, title, agent: agentName, status: "running", stage: 0, stages: GENERIC_STAGES(title, agentName), createdAt: now() });
        say(s, specialist, specialist === "ua"
          ? "On it — pulling the last 7 days of demo performance data. I'll post findings here shortly."
          : "On it — I'll work within the approved asset set and post an updated concept here.", undefined, cid);
        check(s, "c20");
        return;
      }

      // Default: Clayton picks it up as a generic task.
      if (mentions.includes("clayton") || aiMentioned.length === 0) {
        const title = trimmed.length > 48 ? trimmed.slice(0, 48) + "…" : trimmed;
        if (s.tasks.some((t) => t.clientId === cid && t.title === title && t.status === "running")) return;
        const agent = cid === "direct" ? "AI AM" : "UA Agent";
        const tid = id(s, "T");
        s.tasks.unshift({ id: tid, clientId: cid, title, agent, status: "running", stage: 0, stages: GENERIC_STAGES(title, agent), createdAt: now() });
        say(s, cid === "direct" ? "aiam" : "clayton", `Started task ${tid}: “${title}”. I'll post the summary here.`, undefined, cid, { taskId: tid });
      }
    });
  },
  /** Guided demo: advance the Freebeat collaboration scenario one step. */
  collabNext() {
    update((s) => collabAdvance(s));
  },
  /** Reset only the Freebeat collaboration demo slice. */
  resetCollab() {
    update((s) => {
      s.messages = s.messages.filter((m) => m.clientId !== "freebeat");
      s.tasks = s.tasks.filter((t) => t.id !== MAIN_TASK_ID);
      s.briefs = s.briefs.filter((b) => b.clientId !== "freebeat");
      s.campaign = null;
      s.report = { status: "none", external: "" };
      s.pageAccess = "required";
      s.resumed = false;
      s.collab = { step: 0 };
      s.launch = { inFlight: false, requestId: null, dupBlocked: 0, error: null, failNext: false, providerId: "DEMO-META-1024", firstSpend: null };
    });
  },
  approveInternalDeliverable() {
    update((s) => {
      approveInternal(s);
      s.collab.step = Math.max(s.collab.step, 9);
    });
  },
  /** Share approved deliverables with the end client (separate from internal approval). */
  shareDeliverable() {
    update((s) => {
      const b = collabBrief(s);
      if (!b || b.status !== "approved_internal") return;
      b.status = "shared";
      say(s, "system", "Brief CB-101 was shared with Freebeat. It now appears in the Client Portal under Approved creatives. Internal discussion stays private.", undefined, "freebeat", { taskId: MAIN_TASK_ID });
      notify(s, "BlueFocus shared a new creative brief with you.", "/portal");
    });
  },
  markTaskComplete(tid: string) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === tid);
      if (!t || t.status === "completed") return;
      t.status = "completed";
      t.result = t.result ?? `Marked complete by ${actorName(s)}`;
      if (tid === MAIN_TASK_ID) s.collab.step = Math.max(s.collab.step, 9);
      notify(s, `${tid} marked complete.`, "/tasks");
    });
  },
  /** Create the campaign draft from the collaboration summary (existing campaign flow). */
  createCampaignDraft() {
    update((s) => {
      if (s.campaign || !can.editDraft(s.role)) return;
      s.campaign = { id: "CMP-FB-US-01", clientId: "freebeat", name: "Freebeat — US Awareness Campaign", platform: "Meta", objective: "Awareness", geo: "United States", dailyBudget: 200, totalCap: 2000, audience: "US · 18–34 · Interests: music creation, TikTok/Reels creators", placements: ["Instagram Reels", "Facebook Feed", "Instagram Stories"], assets: 3, revision: 1, status: "draft", approvedRevision: null, revisions: [{ rev: 1, by: "UA Agent", change: "Initial proposal" }] };
      say(s, "ua", "Campaign draft CMP-FB-US-01 created from the review: Spring Launch showed Reels CPM 18% below Feed, so I weighted Reels first. Proposal Revision 1 is ready.", "proposal", "freebeat", { taskId: MAIN_TASK_ID });
      if (s.pageAccess !== "connected") {
        check(s, "c6");
        say(s, "clayton", "Proposal is ready, but launch is blocked: Meta Page access isn't authorized and the Wallet isn't funded. You can request human help for access.", "readiness", "freebeat", { taskId: MAIN_TASK_ID });
        notify(s, "T-1024 blocked: Meta Page authorization required.", "/workspace");
      }
    });
  },

  /* ---------------- Legacy task actions ---------------- */
  startMainTask() {
    update((s) => collabStart(s, personFor(s)?.id ?? "sarah"));
  },
  startGenericTask(clientId: string, title: string, agent: string, prompt?: string) {
    update((s) => {
      const tid = id(s, "T");
      s.tasks.unshift({ id: tid, clientId, title, agent, status: "running", stage: 0, stages: GENERIC_STAGES(title, agent), createdAt: now() });
      if (prompt) say(s, personFor(s)?.id ?? "user", prompt, undefined, clientId);
      say(s, clientId === "direct" ? "aiam" : "clayton", `Started task ${tid}: “${title}”. I'll post the summary here.`, undefined, clientId, { taskId: tid });
    });
  },
  retryTask(tid: string) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === tid);
      if (!t) return;
      t.status = "running";
      t.stage = 0;
      t.result = undefined;
    });
  },
  /** Called by the shell's runner on a fixed interval. Advances generic tasks only. */
  tick() {
    const s0 = state;
    if (!s0.tasks.some((t) => t.id !== MAIN_TASK_ID && t.status === "running" && t.stage < t.stages.length)) return;
    update((s) => {
      for (const t of s.tasks) {
        if (t.id === MAIN_TASK_ID || t.status !== "running" || t.stage >= t.stages.length) continue;
        t.stage += 1;
        if (t.stage >= t.stages.length) {
          t.status = "completed";
          t.result = "Summary: spend pacing on track; frequency stable; recommend testing one new hook (demo).";
          const from: MsgFrom = t.agent.includes("UA") ? "ua" : t.agent.includes("Creative") ? "creative" : t.clientId === "direct" ? "aiam" : "clayton";
          say(s, from, `${t.id} done — ${t.result}`, undefined, t.clientId, { taskId: t.id });
          notify(s, `${t.id} completed: ${t.title}`, "/tasks");
        }
      }
    });
  },

  /* ---------------- Support / access ---------------- */
  requestHumanHelp() {
    update((s) => {
      if (s.cases.some((c) => c.type === "Meta Page Authorization" && c.status !== "Closed")) return;
      const cid = "CASE-2041";
      s.cases.unshift({ id: cid, clientId: "freebeat", type: "Meta Page Authorization", owner: ownerFor("Meta Page Authorization"), taskId: MAIN_TASK_ID, status: "Open", updated: now(), diagnostics: ["Ad account act_DEMO_88231 assigned to BlueFocus BM", "Facebook Page “Freebeat” not shared with BlueFocus Business Manager", "Required permission: ADVERTISE on Page", "Customer conversation: summarized only (private messages not shared)", "Credentials: never stored in case"], notes: [] });
      s.pageAccess = "pending_support";
      const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
      if (t) t.caseId = cid;
      check(s, "c7");
      check(s, "c8");
      say(s, "clayton", `I opened ${cid} with Hellyeah Ops (routed to Andy, Meta authorization). Task T-1024 is paused — waiting for support. I'll tell you when access is verified.`);
      notify(s, `${cid} created and routed to Andy.`, "/ops");
    });
  },
  updateCase(cid: string, patch: Partial<Pick<Case, "status">>, note?: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (!c) return;
      if (patch.status) c.status = patch.status;
      if (note?.trim()) c.notes.push(note.trim());
      c.updated = now();
      if (c.type === "Meta Page Authorization" && (c.status === "Resolved" || c.status === "Closed") && s.pageAccess !== "connected") {
        check(s, "c10");
        notify(s, `${cid} marked ${c.status}. Access still unverified — run Verify Connection.`, "/ops");
      }
    });
  },
  openCase(cid: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (c?.type === "Account Opening" && c.owner === "Anita") check(s, "c9");
    });
  },
  verifyConnection(cid: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (!c) return;
      if (c.status === "Open" || c.notes.length === 0) {
        c.recheck = `${now()} · Recheck failed: Page still not shared with BlueFocus BM. Update the case with the fix first.`;
        return;
      }
      c.recheck = `${now()} · Recheck passed: ADVERTISE permission confirmed (simulated).`;
      s.pageAccess = "connected";
      check(s, "c10");
      say(s, "clayton", "Good news — Meta Page access is verified. You can resume T-1024 and continue to approval.", "resume");
      notify(s, "Meta Page access verified. T-1024 can resume.", "/workspace");
    });
  },
  resumeTask() {
    update((s) => {
      if (s.pageAccess !== "connected") return;
      s.resumed = true;
      check(s, "c11");
      say(s, "clayton", "Resumed. Next step: submit the proposal for Admin approval and make sure the Wallet is funded.", "readiness");
    });
  },

  /* ---------------- Campaign / approval / launch ---------------- */
  editCampaign(patch: Partial<Pick<Campaign, "dailyBudget" | "totalCap" | "audience" | "placements">>, change: string) {
    update((s) => {
      const c = s.campaign;
      if (!c || !can.editDraft(s.role)) return;
      if (STATUS_FLOW.indexOf(c.status) >= STATUS_FLOW.indexOf("submitted")) return;
      const hadApproval = c.status === "approved" || c.status === "awaiting_approval";
      Object.assign(c, patch);
      c.revision += 1;
      c.revisions.push({ rev: c.revision, by: actorName(s), change });
      if (hadApproval) {
        c.status = "draft";
        c.approvedRevision = null;
        check(s, "c12");
        notify(s, `Proposal edited to Revision ${c.revision}. Previous approval invalidated.`, "/campaigns");
      }
      say(s, "system", `Proposal updated to Revision ${c.revision}: ${change}${hadApproval ? " — prior approval invalidated." : ""}`);
    });
  },
  submitForApproval() {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "draft" || !can.editDraft(s.role)) return;
      c.status = "awaiting_approval";
      c.changesRequested = undefined;
      if (s.role === "member") check(s, "c4");
      notify(s, `Approval requested for Revision ${c.revision} by ${actorName(s)}.`, "/campaigns");
      say(s, "system", `Revision ${c.revision} submitted for Admin approval.`);
    });
  },
  approve() {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "awaiting_approval" || !can.approve(s.role)) return;
      c.status = "approved";
      c.approvedRevision = c.revision;
      if (s.wallet.activity.some((a) => a.amount > 0)) check(s, "c5");
      notify(s, `Revision ${c.revision} approved by ${actorName(s)}.`, "/campaigns");
      say(s, "system", `Admin approved Revision ${c.revision}. Campaign proposal is ready for launch once readiness checks pass.`);
    });
  },
  requestChanges(note: string) {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "awaiting_approval" || !can.approve(s.role)) return;
      c.status = "draft";
      c.changesRequested = note || "Changes requested";
      notify(s, `Changes requested on Revision ${c.revision}: ${c.changesRequested}`, "/campaigns");
    });
  },
  addFunds(amount: number) {
    update((s) => {
      if (!can.fund(s.role) || !(amount > 0)) return;
      s.wallet.balance += amount;
      s.wallet.activity.unshift({ id: id(s, "W"), text: "Simulated top-up (no real payment)", amount, by: actorName(s) });
      if (s.campaign?.approvedRevision) check(s, "c5");
      notify(s, `Wallet funded with $${amount.toLocaleString()} (simulated).`, "/wallet");
    });
  },
  /** Idempotent launch: a second click while a request is in flight is rejected. */
  launch() {
    const s0 = state;
    if (s0.launch.inFlight) {
      update((s) => {
        s.launch.dupBlocked += 1;
        check(s, "c13");
      });
      return;
    }
    const c = s0.campaign;
    if (!c || c.status !== "approved" || c.approvedRevision !== c.revision || !isReady(s0) || !can.launch(s0.role)) return;
    update((s) => {
      s.launch.inFlight = true;
      s.launch.requestId = `LR-${c.revision}-${s.seq}`;
      s.launch.error = null;
    });
    setTimeout(() => {
      update((s) => {
        s.launch.inFlight = false;
        if (s.campaign && s.campaign.status === "approved") {
          s.campaign.status = "submitted";
          notify(s, "Launch submitted to Hellyeah Ops (simulated).", "/campaigns");
        }
      });
    }, 1600);
  },
  advanceLaunch() {
    update((s) => {
      const c = s.campaign;
      if (!c) return;
      const i = STATUS_FLOW.indexOf(c.status);
      if (i < STATUS_FLOW.indexOf("submitted") || c.status === "live_verified") return;
      const next = STATUS_FLOW[i + 1]!;
      if (next === "provider_accepted") {
        if (s.launch.failNext) {
          s.launch.failNext = false;
          s.launch.error = "Simulated provider error: Meta returned a temporary 503. Retry is safe (same request ID).";
          return;
        }
        if (!s.launch.providerId.trim()) {
          s.launch.error = "Provider campaign ID required to mark accepted.";
          return;
        }
      }
      if (next === "live_verified" && s.launch.firstSpend == null) {
        s.launch.error = "First spend confirmation required before Live Verified.";
        return;
      }
      s.launch.error = null;
      c.status = next;
      if (next === "live_verified") {
        check(s, "c14");
        s.report = { status: "draft", external: DEFAULT_EXTERNAL };
        say(s, "clayton", "Campaign is Live Verified (simulated). Here's the first Daily Performance Update — internal draft, not shared with the client.", "report");
        notify(s, "Freebeat US Awareness is Live Verified. T-1024 completed.", "/analytics");
      }
    });
  },
  setLaunch(patch: Partial<State["launch"]>) {
    update((s) => Object.assign(s.launch, patch));
  },
  retryLaunch() {
    update((s) => {
      s.launch.error = null;
    });
  },
  setReport(patch: Partial<State["report"]>) {
    update((s) => {
      Object.assign(s.report, patch);
      if (patch.status === "published") {
        check(s, "c15");
        notify(s, "Daily Performance Update published to the Freebeat Client Portal.", "/portal");
      }
    });
  },
  markAllRead() {
    update((s) => s.notifications.forEach((n) => (n.read = true)));
  },
  markCheck(c: string) {
    update((s) => check(s, c));
  },
  setClientAiAm(v: boolean) {
    update((s) => {
      s.clientAiAm = v;
    });
  },
  setCreativeLevel(v: State["creativeLevel"]) {
    update((s) => {
      if (s.role !== "ops") return;
      s.creativeLevel = v;
      notify(s, `Ops set Creative capability to ${v} (simulated entitlement change).`, "/capabilities");
    });
  },
  togglePortalAction(pid: string) {
    update((s) => {
      const a = s.portalActions.find((x) => x.id === pid);
      if (a) a.done = !a.done;
    });
  },
  contactAm(text: string) {
    update((s) => {
      s.portalRequests.push(text);
      notify(s, `Freebeat client request for AM: “${text}”`, "/overview");
    });
  },
  slackAsk() {
    update((s) => {
      const v = mainTaskView(s);
      s.slackReplies.push(v ? `T-1024 is ${v.status.replace("_", " ")} — ${v.detail}` : "No active Freebeat task yet.");
    });
  },
};
