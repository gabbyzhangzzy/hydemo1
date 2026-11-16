/**
 * P0 Card Workflow — the nine-step Freebeat app-install scenario shown in
 * #freebeat-growth. Pure functions over `P0State`; the store wraps them in
 * `actions.p0*`. All data and platform responses are simulated.
 */
export type P0From = "bfa" | "clayton" | "ua" | "creative" | "system";
export type P0Card = "brief" | "proposal" | "cbrief" | "production" | "creative" | "exec" | "action" | "launch" | "status" | "perf" | "followup";
export interface P0Event { id: string; from: P0From; text: string; card?: P0Card; at: string }

export type VersionStatus = "Pending Review" | "Approved" | "Changes Requested";
export interface P0Creative {
  id: string; name: string; concept: string; source: "Uploaded" | "AI Generated";
  format: string; placement: string; preview: number; selected: boolean;
  versions: { n: number; note: string; status: VersionStatus }[];
}
export type ExecMode = "scale" | "ab_audience" | "ab_creative";
export type Platform = "Meta" | "TikTok";
export interface ExecItem { id: string; platform: Platform; level: "campaign" | "adset" | "ad"; name: string; status: "created" | "failed" | "blocked"; error?: string }
export type CheckStatus = "ready" | "blocked" | "pending" | "review";
export interface LaunchCheck { id: string; label: string; status: CheckStatus; issue?: string; resources?: string; owner?: string; next?: string; resolved?: boolean; opsRequested?: boolean }

export const LIFECYCLE = ["Draft Created", "Submitted", "Platform Review", "Approved", "Delivery Pending", "Live Verified"] as const;

export interface P0State {
  active: boolean;
  seq: number;
  role: "admin" | "member";
  events: P0Event[];
  brief: { posted: boolean; conversionEvent: string | null; targetCpi: number | null };
  proposal: { revision: number; metaPct: number; status: "none" | "pending" | "changes" | "approved"; approvedRevision: number | null; history: { revision: number; metaPct: number; note: string }[] };
  cbrief: { status: "none" | "pending" | "approved"; revision: number; notes: string[] };
  production: "idle" | "generating" | "done";
  creatives: P0Creative[];
  handedOff: boolean;
  exec: { built: boolean; mode: ExecMode; revision: number; items: ExecItem[]; attempts: number; failDemo: boolean; notes: string[]; continued: boolean };
  checks: LaunchCheck[];
  checksRun: number;
  launch: { status: "none" | "approved"; approvedBy: string | null; binding: string | null; invalidated: string | null };
  lifecycle: { stage: number; failDemo: boolean; failed: string | null; submitted: string[]; retries: number; lastVerified: string | null };
  perf: { shown: boolean; why: boolean; next: boolean; followUpTaskId: string | null };
}

export const STEP_LABELS = [
  "Marketing request & brief",
  "Proposal approval (C1)",
  "Creative brief & production",
  "Creative review (C2)",
  "Batch campaign review (C3)",
  "Pre-launch checks (C5)",
  "Launch authorization",
  "Campaign status (C4)",
  "Day-7 performance (C6)",
];

export const SAMPLE_REQUEST =
  "@Clayton We want to launch an app install campaign for Freebeat in the US and Canada. Budget is $300/day for 14 days. We'd like to test Meta and TikTok. We have two existing creatives but also want some new AI-generated concepts.";
export const SAMPLE_ANSWER = "Optimize for App Install. Our target CPI is $2.30.";
export const SAMPLE_CHANGE = "Increase Meta allocation to 70%.";
export const SAMPLE_PERF = "@UA Agent How did Freebeat perform over the last seven days?";

export const DAILY = 300;
export const DAYS = 14;
export const TOTAL_CAP = DAILY * DAYS;

const stamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function initialP0(): P0State {
  return {
    active: false, seq: 0, role: "admin", events: [],
    brief: { posted: false, conversionEvent: null, targetCpi: null },
    proposal: { revision: 0, metaPct: 60, status: "none", approvedRevision: null, history: [] },
    cbrief: { status: "none", revision: 0, notes: [] },
    production: "idle",
    creatives: [],
    handedOff: false,
    exec: { built: false, mode: "ab_creative", revision: 0, items: [], attempts: 0, failDemo: true, notes: [], continued: false },
    checks: [], checksRun: 0,
    launch: { status: "none", approvedBy: null, binding: null, invalidated: null },
    lifecycle: { stage: 0, failDemo: true, failed: null, submitted: [], retries: 0, lastVerified: null },
    perf: { shown: false, why: false, next: false, followUpTaskId: null },
  };
}

function say(p: P0State, from: P0From, text: string, card?: P0Card) {
  p.seq += 1;
  p.events.push({ id: `P0-${p.seq}`, from, text, at: stamp(), ...(card ? { card } : {}) });
}

/** Number of completed workflow steps (0–9). Derived, never stored. */
export function completedSteps(p: P0State): number {
  if (!p.active) return 0;
  const done = [
    p.brief.conversionEvent != null,
    p.proposal.status === "approved",
    p.production === "done",
    p.handedOff,
    p.exec.continued,
    p.checks.length > 0 && checksPass(p),
    p.launch.status === "approved",
    p.lifecycle.stage >= LIFECYCLE.length - 1,
    p.perf.shown,
  ];
  let n = 0;
  while (n < done.length && done[n]) n++;
  return n;
}

/* ---------------- Step 1 ---------------- */
export function start(p: P0State, text = SAMPLE_REQUEST) {
  if (p.active) return;
  p.active = true;
  say(p, "bfa", text);
  say(p, "clayton", "Got it, Maya. I've opened task T-2001 · Freebeat App Install Launch. @UA Agent will draft the channel strategy and @Creative Agent will research concepts. Two things I need before UA can finish: which conversion event should we optimize for, and do you have a target CPI?");
  say(p, "clayton", "Brief summary so far", "brief");
  p.brief.posted = true;
}

export function answerBrief(p: P0State, text = SAMPLE_ANSWER) {
  if (!p.active || p.brief.conversionEvent) return;
  const cpi = text.match(/\$?\s*(\d+(?:\.\d+)?)/);
  p.brief.conversionEvent = /purchase/i.test(text) ? "First Purchase" : "App Install";
  p.brief.targetCpi = cpi ? Number(cpi[1]) : 2.3;
  say(p, "bfa", text);
  p.proposal = { ...p.proposal, revision: 1, status: "pending", history: [{ revision: 1, metaPct: p.proposal.metaPct, note: "Initial proposal" }] };
  say(p, "ua", "Here's the coordinated proposal. Meta carries 60% because it has Freebeat's install history and Advantage+ app audiences; TikTok gets 40% to test creator-style hooks with the 18–34 music audience. Approving authorizes preparation only — nothing spends until a separate launch approval.", "proposal");
}

/* ---------------- Step 2 ---------------- */
export function requestProposalChanges(p: P0State, note = SAMPLE_CHANGE) {
  if (p.proposal.status !== "pending" && p.proposal.status !== "changes") return;
  const m = note.match(/meta[^\d]*(\d{2})\s*%/i) ?? note.match(/(\d{2})\s*%[^.]*meta/i);
  const pct = m ? Math.min(90, Math.max(10, Number(m[1]))) : p.proposal.metaPct;
  say(p, "bfa", note);
  p.proposal.revision += 1;
  p.proposal.metaPct = pct;
  p.proposal.status = "pending";
  p.proposal.history.push({ revision: p.proposal.revision, metaPct: pct, note });
  say(p, "ua", `Proposal v${p.proposal.revision} is ready: Meta ${pct}% · TikTok ${100 - pct}%. Total cap is unchanged at $${TOTAL_CAP.toLocaleString()}. v${p.proposal.revision - 1} is kept in the revision history.`);
}

export function approveProposal(p: P0State, by = "Maya Chen") {
  if (p.proposal.status !== "pending") return;
  p.proposal.status = "approved";
  p.proposal.approvedRevision = p.proposal.revision;
  say(p, "system", `${by} approved Proposal v${p.proposal.revision} — preparation only. No ad spend is authorized.`);
  say(p, "clayton", "Plan approved. I've passed the approved plan to @Creative Agent for the creative brief.");
  p.cbrief = { status: "pending", revision: 1, notes: [] };
  say(p, "creative", "Creative brief for the approved plan:", "cbrief");
}

/* ---------------- Step 3 ---------------- */
export function requestCreativeChanges(p: P0State, note = "Make the hooks shorter — under 2 seconds.") {
  if (p.cbrief.status !== "pending") return;
  say(p, "bfa", note);
  p.cbrief.revision += 1;
  p.cbrief.notes.push(note);
  say(p, "creative", `Updated the creative brief (rev ${p.cbrief.revision}): ${note}`);
}

export function approveCreativeBrief(p: P0State) {
  if (p.cbrief.status !== "pending") return;
  p.cbrief.status = "approved";
  p.production = "generating";
  say(p, "creative", "Brief approved. Generating three concepts (simulated production)…", "production");
}

export function seedCreatives(): P0Creative[] {
  return [
    { id: "FC-1", name: "“Drop the beat” 15s", concept: "Customer hero video — song to video in one tap", source: "Uploaded", format: "Video 9:16 · 15s", placement: "Reels / TikTok feed", preview: 0, selected: true, versions: [{ n: 1, note: "Customer upload", status: "Pending Review" }] },
    { id: "FC-2", name: "Creator remix montage", concept: "Existing creator montage", source: "Uploaded", format: "Video 9:16 · 30s", placement: "Reels / Stories", preview: 1, selected: true, versions: [{ n: 1, note: "Customer upload", status: "Pending Review" }] },
    { id: "FC-3", name: "POV: your song becomes a video", concept: "Direction A — POV hook", source: "AI Generated", format: "Video 9:16 · 15s", placement: "TikTok feed", preview: 11, selected: true, versions: [{ n: 1, note: "AI concept v1", status: "Pending Review" }] },
    { id: "FC-4", name: "Beat-sync teaser loop", concept: "Direction B — beat-sync loop", source: "AI Generated", format: "Video 1:1 · 6s", placement: "Meta feed", preview: 10, selected: true, versions: [{ n: 1, note: "AI concept v1", status: "Pending Review" }] },
    { id: "FC-5", name: "Your soundtrack, your story", concept: "Direction C — lifestyle story", source: "AI Generated", format: "Image 4:5", placement: "Meta feed", preview: 9, selected: true, versions: [{ n: 1, note: "AI concept v1", status: "Pending Review" }] },
  ];
}

export function finishProduction(p: P0State) {
  if (p.production !== "generating") return;
  p.production = "done";
  p.creatives = seedCreatives();
  say(p, "creative", "Production finished: 3 AI concepts generated, plus the 2 uploaded assets. Ready for review.", "creative");
}

/* ---------------- Step 4 ---------------- */
export const cur = (c: P0Creative) => c.versions[c.versions.length - 1]!;
export function approvedCreatives(p: P0State) {
  return p.creatives.filter((c) => c.selected && cur(c).status === "Approved");
}
export function toggleSelect(p: P0State, cid: string) {
  if (p.handedOff) return;
  const c = p.creatives.find((x) => x.id === cid);
  if (c) c.selected = !c.selected;
}
export function approveSelected(p: P0State) {
  if (p.handedOff) return;
  const list = p.creatives.filter((c) => c.selected && cur(c).status === "Pending Review");
  list.forEach((c) => (cur(c).status = "Approved"));
  if (list.length) say(p, "system", `Maya Chen approved ${list.map((c) => `${c.name} v${cur(c).n}`).join(", ")}.`);
}
export function requestRevision(p: P0State, cid: string, note = "Show the app UI in the first second.") {
  if (p.handedOff) return;
  const c = p.creatives.find((x) => x.id === cid);
  if (!c) return;
  const v = cur(c);
  v.status = "Changes Requested";
  c.versions.push({ n: v.n + 1, note: `Revision: ${note}`, status: "Pending Review" });
  say(p, "bfa", `Revision for ${c.name} v${v.n}: ${note}`);
  say(p, "creative", `Created ${c.name} v${v.n + 1}. v${v.n} stays in version history; v${v.n + 1} needs review.`);
}
export function handOff(p: P0State) {
  if (p.handedOff || approvedCreatives(p).length === 0) return;
  p.handedOff = true;
  say(p, "clayton", `${approvedCreatives(p).length} approved creatives handed to @UA Agent. Unselected or unapproved assets are excluded.`);
  buildExec(p);
}

/* ---------------- Step 5 ---------------- */
function itemsFor(p: P0State): ExecItem[] {
  const n = Math.max(1, approvedCreatives(p).length);
  const out: ExecItem[] = [];
  const mode = p.exec.mode;
  for (const pf of ["Meta", "TikTok"] as Platform[]) {
    const k = pf === "Meta" ? "M" : "T";
    out.push({ id: `${k}-C1`, platform: pf, level: "campaign", name: mode === "scale" ? `Freebeat ${pf} · CA Expansion` : `Freebeat ${pf} · App Install`, status: "created" });
    const sets = mode === "ab_audience" ? 2 : 1;
    for (let a = 1; a <= sets; a++) {
      out.push({ id: `${k}-S${a}`, platform: pf, level: "adset", name: `${pf === "Meta" ? "Ad Set" : "Ad Group"} ${a}${mode === "ab_audience" ? (a === 1 ? " · Broad 18–34" : " · Music creators LAL") : ""}`, status: "created" });
      const ads = mode === "ab_audience" ? 1 : n;
      for (let d = 1; d <= ads; d++) out.push({ id: `${k}-S${a}-A${d}`, platform: pf, level: "ad", name: `Ad ${d}`, status: "created" });
    }
  }
  return out;
}

export function buildExec(p: P0State) {
  p.exec.revision += 1;
  p.exec.attempts = 1;
  p.exec.built = true;
  p.exec.items = itemsFor(p);
  if (p.exec.failDemo) {
    const t = p.exec.items.find((i) => i.platform === "TikTok" && i.level === "adset");
    if (t) { t.status = "failed"; t.error = "TikTok API timeout (simulated)"; }
    p.exec.items.filter((i) => i.platform === "TikTok" && i.level === "ad" && i.id.startsWith(t?.id ?? "x")).forEach((i) => { i.status = "blocked"; i.error = "Waiting for parent ad group"; });
    p.exec.failDemo = false; // the demo failure happens once
  }
  if (p.exec.revision === 1) say(p, "ua", "Campaign drafts prepared (revision 1). Review the batch below.", "exec");
  else say(p, "ua", `Rebuilt the batch as execution revision ${p.exec.revision}; the Batch Campaign Review card above shows the latest configuration.`);
}

export function execCounts(p: P0State) {
  const c = (l: ExecItem["level"]) => p.exec.items.filter((i) => i.level === l).length;
  const s = (st: ExecItem["status"]) => p.exec.items.filter((i) => i.status === st).length;
  return { campaigns: c("campaign"), adsets: c("adset"), ads: c("ad"), created: s("created"), failed: s("failed"), blocked: s("blocked") };
}

/** Retries only failed/blocked items. Successful items keep their ids and are never re-created. */
export function retryExec(p: P0State) {
  const bad = p.exec.items.filter((i) => i.status !== "created");
  if (!bad.length) return;
  p.exec.attempts += 1;
  bad.forEach((i) => { i.status = "created"; delete i.error; });
  say(p, "ua", `Retried ${bad.length} failed/blocked items. ${p.exec.items.length - bad.length} existing items were skipped — no duplicates created.`);
}

/** Material change → new revision; invalidates launch approval & checks. */
function invalidate(p: P0State, why: string) {
  if (p.launch.status === "approved") return false;
  if (p.exec.continued) {
    p.exec.continued = false;
    p.checks = [];
    p.checksRun = 0;
    p.launch.invalidated = why;
  }
  return true;
}

export function setMode(p: P0State, mode: ExecMode) {
  if (p.exec.mode === mode || p.launch.status === "approved") return;
  if (!invalidate(p, "Batch mode changed")) return;
  p.exec.mode = mode;
  buildExec(p);
}

export function modifyExec(p: P0State, note = "Move 10% of TikTok budget into Meta Reels placements.") {
  if (p.launch.status === "approved") return;
  invalidate(p, `Configuration changed: ${note}`);
  say(p, "bfa", `@UA Agent ${note}`);
  p.exec.notes.push(note);
  p.exec.revision += 1;
  say(p, "ua", `Done — execution revision ${p.exec.revision}. Any earlier launch checks were invalidated and must run again.`);
}

/* ---------------- Step 6 ---------------- */
export function seedChecks(p: P0State): LaunchCheck[] {
  return [
    { id: "acct", label: "Ad Account authorization", status: "pending", issue: "BlueFocus needs Advertiser-level permission on Meta ad account act_8812 (Freebeat US).", resources: "Meta · act_8812 · 1 campaign", owner: "Maya Chen (Admin)", next: "Verify permission in Meta Business Settings" },
    { id: "perm", label: "User permissions", status: "ready" },
    { id: "funds", label: "Available funds / billing", status: "ready" },
    { id: "track", label: "Conversion tracking", status: "blocked", issue: "TikTok App Install event has not been verified for the Freebeat iOS/Android apps.", resources: "TikTok · Ad Groups 1 · " + (p.exec.items.filter((i) => i.platform === "TikTok" && i.level === "ad").length) + " ads", owner: "Freebeat dev team via Maya", next: "Fire a test install event in TikTok Events Manager" },
    { id: "creative", label: "Creative approval", status: approvedCreatives(p).length ? "ready" : "blocked" },
    { id: "policy", label: "Policy restrictions", status: "review", issue: "Music-rights wording is under automated policy review.", owner: "Platform (simulated)", next: "Recheck — review completes automatically" },
    { id: "budget", label: "Budget & launch authorization", status: "ready", issue: `Cap $${TOTAL_CAP.toLocaleString()} within limits; final launch approval still required.` },
  ];
}

export function continueToChecks(p: P0State) {
  if (!p.exec.built || p.exec.continued || execCounts(p).failed + execCounts(p).blocked > 0) return;
  p.exec.continued = true;
  p.launch.invalidated = null;
  p.checks = seedChecks(p);
  p.checksRun = 1;
  say(p, "clayton", "I ran the pre-launch checks. Two items need action before launch.", "action");
}
export function checksPass(p: P0State) {
  return p.checks.length > 0 && p.checks.every((c) => c.status === "ready");
}
export function resolveIssue(p: P0State, cid: string) {
  const c = p.checks.find((x) => x.id === cid);
  if (!c || c.status === "ready") return;
  c.resolved = true;
  say(p, "system", `Demo action: ${c.label} marked as fixed by Maya. Run Recheck to verify.`);
}
export function requestOps(p: P0State, cid: string) {
  const c = p.checks.find((x) => x.id === cid);
  if (!c || c.opsRequested) return;
  c.opsRequested = true;
  c.owner = `${c.owner ?? "—"} + Hellyeah Ops (Andy)`;
  say(p, "system", `Ops help requested for “${c.label}”. Andy from Hellyeah Ops was added to the case.`);
}
export function recheck(p: P0State) {
  if (!p.checks.length) return;
  p.checksRun += 1;
  p.checks.forEach((c) => {
    if (c.status === "review") c.status = "ready";
    else if ((c.status === "blocked" || c.status === "pending") && c.resolved) c.status = "ready";
  });
  if (checksPass(p)) {
    say(p, "clayton", "All pre-launch checks passed. Final launch authorization is ready below.", "launch");
  } else {
    const left = p.checks.filter((c) => c.status !== "ready").map((c) => c.label);
    say(p, "clayton", `Recheck #${p.checksRun}: still waiting on ${left.join(", ")}.`);
  }
}

/* ---------------- Step 7 ---------------- */
export function binding(p: P0State) {
  return `Proposal v${p.proposal.approvedRevision} · Execution rev ${p.exec.revision} · ${approvedCreatives(p).map((c) => `${c.id} v${cur(c).n}`).join(", ")}`;
}
export function canLaunch(p: P0State): { ok: boolean; reason?: string } {
  if (p.role !== "admin") return { ok: false, reason: "Only a BlueFocus Admin can approve a live launch. Members can review but not authorize spend." };
  if (!checksPass(p)) return { ok: false, reason: "Pre-launch checks have not all passed." };
  if (p.proposal.status !== "approved") return { ok: false, reason: "Proposal is not approved." };
  if (p.launch.status === "approved") return { ok: false, reason: "Already approved." };
  return { ok: true };
}
export function approveLaunch(p: P0State) {
  if (!canLaunch(p).ok) return;
  p.launch = { status: "approved", approvedBy: "Maya Chen", binding: binding(p), invalidated: null };
  p.lifecycle.stage = 1;
  p.lifecycle.submitted = p.exec.items.filter((i) => i.level === "campaign").map((i) => i.id);
  say(p, "system", `Maya Chen approved launch — ${p.launch.binding}. Spend cap $${TOTAL_CAP.toLocaleString()}.`);
  say(p, "ua", "Submitted to Meta and TikTok. Tracking status below — not live until delivery is verified.", "status");
}

/* ---------------- Step 8 ---------------- */
export function advanceLifecycle(p: P0State) {
  const l = p.lifecycle;
  if (p.launch.status !== "approved" || l.failed || l.stage >= LIFECYCLE.length - 1) return;
  if (l.stage === 2 && l.failDemo) {
    l.failed = "TikTok ad group submission timed out during platform review (simulated).";
    l.failDemo = false;
    return;
  }
  l.stage += 1;
  if (l.stage === LIFECYCLE.length - 1) {
    l.lastVerified = stamp();
    say(p, "ua", "Delivery verified: both campaigns recorded first impressions (simulated verification event).");
  }
}
export function retryLifecycle(p: P0State) {
  if (!p.lifecycle.failed) return;
  p.lifecycle.failed = null;
  p.lifecycle.retries += 1;
  say(p, "ua", "Resubmitted the failed TikTok ad group only. Existing campaigns were not re-created.");
}

/* ---------------- Step 9 ---------------- */
export function perfReport(metaPct: number) {
  const spend = 2016.4;
  const plat = (name: Platform, share: number, cpi: number, ctr: number, cpm: number) => {
    const sp = Math.round(spend * share * 100) / 100;
    const installs = Math.round(sp / cpi);
    const impressions = Math.round((sp / cpm) * 1000);
    const clicks = Math.round(impressions * ctr);
    return { name, spend: sp, installs, cpi: sp / installs, impressions, clicks, ctr: clicks / impressions };
  };
  const meta = plat("Meta", metaPct / 100, 2.12, 0.0142, 9.8);
  const tiktok = plat("TikTok", 1 - metaPct / 100, 2.58, 0.0098, 6.4);
  const installs = meta.installs + tiktok.installs;
  const total = meta.spend + tiktok.spend;
  return { spend: total, installs, cpi: total / installs, clicks: meta.clicks + tiktok.clicks, impressions: meta.impressions + tiktok.impressions, platforms: [meta, tiktok], change: -0.06 };
}
export function showPerf(p: P0State, text = SAMPLE_PERF) {
  if (p.perf.shown || p.lifecycle.stage < LIFECYCLE.length - 1) return;
  p.perf.shown = true;
  say(p, "bfa", text);
  say(p, "ua", "Day-7 performance review (demo data):", "perf");
}
export function askWhy(p: P0State) {
  if (!p.perf.shown || p.perf.why) return;
  p.perf.why = true;
  const r = perfReport(p.proposal.metaPct);
  const [m, t] = r.platforms;
  say(p, "ua", `Blended CPI is $${r.cpi.toFixed(2)} vs the $${(p.brief.targetCpi ?? 2.3).toFixed(2)} target. Meta is at $${m!.cpi.toFixed(2)} with a ${(m!.ctr * 100).toFixed(2)}% CTR, while TikTok is at $${t!.cpi.toFixed(2)} — its ${(t!.ctr * 100).toFixed(2)}% CTR suggests the opening hook isn't stopping the scroll. CPI improved ${Math.abs(r.change * 100).toFixed(0)}% from days 1–3 to days 4–7 as learning finished.`);
}
export function discussNext(p: P0State) {
  if (!p.perf.shown || p.perf.next) return;
  p.perf.next = true;
  say(p, "clayton", "Recommendation (optional): test a new 1-second creator hook on TikTok against the current best ad. Budget stays the same; nothing changes unless you create the task and later approve it.", "followup");
}

/** Typed messages that advance the scenario. Returns true when handled. */
export function handleText(p: P0State, text: string): boolean {
  if (!p.active) { if (/app install/i.test(text) && /@?clayton/i.test(text)) { start(p, text); return true; } return false; }
  if (p.brief.posted && !p.brief.conversionEvent) { answerBrief(p, text); return true; }
  if (p.proposal.status === "pending" && /(meta|tiktok).*%|%.*(meta|tiktok)/i.test(text)) { requestProposalChanges(p, text); return true; }
  if (p.exec.built && p.launch.status !== "approved" && /@?ua agent/i.test(text) && /(budget|audience|placement|change|move)/i.test(text)) { modifyExec(p, text.replace(/@UA Agent\s*/i, "")); return true; }
  if (/perform/i.test(text) && p.lifecycle.stage >= LIFECYCLE.length - 1) { showPerf(p, text); return true; }
  return false;
}

/** Guided "Next Step": performs the canonical happy-path action for the current state. */
export function next(p: P0State): boolean {
  if (!p.active) { start(p); return true; }
  if (!p.brief.conversionEvent) { answerBrief(p); return true; }
  if (p.proposal.status === "pending") { approveProposal(p); return true; }
  if (p.cbrief.status === "pending") { approveCreativeBrief(p); return true; }
  if (p.production === "generating") { finishProduction(p); return true; }
  if (!p.handedOff) {
    if (p.creatives.some((c) => c.selected && cur(c).status === "Pending Review")) approveSelected(p);
    handOff(p); return true;
  }
  if (execCounts(p).failed + execCounts(p).blocked > 0) { retryExec(p); return true; }
  if (!p.exec.continued) { continueToChecks(p); return true; }
  if (!checksPass(p)) { p.checks.forEach((c) => { if (c.status !== "ready" && c.status !== "review") c.resolved = true; }); recheck(p); return true; }
  if (p.launch.status !== "approved") { p.role = "admin"; approveLaunch(p); return true; }
  if (p.lifecycle.failed) { retryLifecycle(p); return true; }
  if (p.lifecycle.stage < LIFECYCLE.length - 1) { advanceLifecycle(p); return true; }
  if (!p.perf.shown) { showPerf(p); return true; }
  return false;
}
