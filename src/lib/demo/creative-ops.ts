/**
 * Creative Operations — Requests, Production Jobs, Output QA, Verified Delivery
 * and the simulated Google Drive connection. Pure helpers that mutate a draft
 * State inside `update()`; the store exposes them through `actions.*`.
 *
 * Three statuses are deliberately separate:
 *  - Request status   → derived by `requestStatus()` (never stored)
 *  - Job status       → ProductionJob.status (per generation attempt)
 *  - Version review   → CreativeVersion.review (existing review model)
 */
import type { State } from "./store";
import type { CreativeAsset, CreativeVersion } from "./creative-model";
import { effectiveApproval } from "./creative-model";
import { makeVersion, CREATIVE_PREVIEWS } from "./creative-seed";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type BriefField = "objective" | "audience" | "sellingPoint" | "platform" | "format" | "quantity" | "deadline" | "market";
export interface CreativeBrief {
  objective?: string;
  audience?: string;
  sellingPoint?: string;
  platform?: string;
  format?: string;
  quantity?: number;
  deadline?: string;
  market?: string;
  avoid?: string;
  direction?: string;
  /** Fields the agent suggested from client context (shown as "suggested"). */
  suggested: BriefField[];
}
export interface IntakeMsg { from: "human" | "agent"; by: string; text: string; at: string }
export interface RequestEvent { at: string; actor: string; kind: "Human" | "Agent" | "System"; action: string }
export interface CreativeRequest {
  id: string;
  clientId: string;
  name: string;
  owner: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  source: "Creative page" | "Agent Workspace" | "Campaign";
  brief: CreativeBrief;
  /** Existing library assets used as references (inputs to production). */
  references: string[];
  /** Approved existing assets reused directly as deliverables (reduce generation). */
  reused: string[];
  /** Agent-suggested existing assets, offered before generating new ones. */
  suggestedAssets: string[];
  confirmed: boolean;
  submitted: boolean;
  deliveredAt?: string;
  deliveredBy?: string;
  campaignId?: string;
  taskId?: string;
  /** Demo scenario: slot 2 fails on first attempt, slot 3 output exceeds duration. */
  scenario?: boolean;
  intake: IntakeMsg[];
  events: RequestEvent[];
}
export type JobStatus = "Queued" | "Running" | "Succeeded" | "Failed" | "Cancelled" | "Outcome Unknown";
export type CostState = "Estimated" | "Confirmed" | "Unknown / Pending Reconciliation";
export interface ProductionJob {
  id: string;
  requestId: string;
  clientId: string;
  slot: number;
  attempt: number;
  retryOf?: string;
  inputs: string[];
  provider: string;
  format: string;
  status: JobStatus;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: { message: string; causeKnown: boolean; outputProduced: boolean; retryable: boolean };
  outputAssetId?: string;
  cost: { amount: number | null; state: CostState };
}
export interface DriveFile {
  id: string;
  folderId: string;
  name: string;
  format: "Image" | "Video";
  mime: string;
  width: number;
  height: number;
  duration?: number;
  size: number;
  modifiedAt: string;
  revision: number;
  removed: boolean;
  /** Validation failure discovered when the file is opened (known reason). */
  unreadable?: string;
  preview: string;
}
export interface DriveFolder {
  id: string;
  name: string;
  /** Client mapping approved by an Admin; null = not mapped (cannot import). */
  clientId: string | null;
  synced: boolean;
  status: "Not synced" | "Synced" | "Partial failure" | "Authorization Required";
  lastSynced?: string;
  accessRevoked: boolean;
  errors: { fileId: string; name: string; reason: string }[];
  lastResult?: { imported: number; skipped: number; updated: number; failed: number };
}
export interface DriveState {
  connected: boolean;
  account: string;
  connectedBy?: string;
  connectedAt?: string;
  folders: DriveFolder[];
  files: DriveFile[];
}
export interface DriveMeta {
  fileId: string;
  folderId: string;
  folderName: string;
  account: string;
  fileName: string;
  modifiedAt: string;
  syncedAt: string;
  revision: number;
  status: "Synced" | "Source update available" | "Source Unavailable / Removed from Drive";
  pendingRevision?: number;
}

/* ------------------------------------------------------------------ */
/* Brief requirements & intake parsing                                 */
/* ------------------------------------------------------------------ */
export const BRIEF_FIELDS: { key: BriefField; label: string; question: string }[] = [
  { key: "objective", label: "Marketing Objective", question: "Is this for new user acquisition or retargeting? That will affect the creative direction." },
  { key: "audience", label: "Target Audience", question: "Who should these creatives speak to?" },
  { key: "sellingPoint", label: "Product / Key Selling Point", question: "Which product or key selling point should lead?" },
  { key: "platform", label: "Advertising Platform", question: "Which platform will run these — Meta, TikTok or Google?" },
  { key: "format", label: "Placement / Format", question: "Which placement or format do you need — vertical video, square static or carousel?" },
  { key: "quantity", label: "Quantity", question: "How many creatives do you need?" },
  { key: "deadline", label: "Deadline", question: "When do you need them delivered?" },
  { key: "market", label: "Language / Market", question: "Which language and market are these for?" },
];
export const OBJECTIVES = ["User Acquisition", "Retargeting", "Awareness", "Lead Generation", "Conversion / Sales"];
export const FORMATS = ["9:16 vertical video", "1:1 square video", "1:1 static image", "4:5 feed image", "1:1 carousel images"];
export const PLATFORMS = ["Meta", "TikTok Ads", "Google Ads"];

export function missingFields(b: CreativeBrief): BriefField[] {
  return BRIEF_FIELDS.map((f) => f.key).filter((k) => {
    const v = b[k];
    return v === undefined || v === "" || (k === "quantity" && !(Number(v) > 0));
  });
}
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
/** Extract brief fields from natural language. Only returns what the text states. */
export function parseBrief(text: string): Partial<CreativeBrief> {
  const t = text.toLowerCase();
  const out: Partial<CreativeBrief> = {};
  if (/retarget|re-engage|lapsed|win.?back/.test(t)) out.objective = "Retargeting";
  else if (/user acquisition|\bua\b|new users?|acquisition|install/.test(t)) out.objective = "User Acquisition";
  else if (/awareness|reach/.test(t)) out.objective = "Awareness";
  else if (/lead/.test(t)) out.objective = "Lead Generation";
  else if (/conversion|sales|purchase/.test(t)) out.objective = "Conversion / Sales";
  if (/tiktok/.test(t)) out.platform = "TikTok Ads";
  else if (/google|youtube/.test(t)) out.platform = "Google Ads";
  else if (/meta|facebook|instagram|reels/.test(t)) out.platform = "Meta";
  if (/carousel/.test(t)) out.format = "1:1 carousel images";
  else if (/static|image|banner|still/.test(t)) out.format = /4:5|feed/.test(t) ? "4:5 feed image" : "1:1 static image";
  else if (/video|ugc|reel|clip/.test(t)) out.format = /square|1:1/.test(t) ? "1:1 square video" : "9:16 vertical video";
  const q = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:new\s+|more\s+)?(?:\w+\s+){0,2}(?:videos?|concepts?|ads?|images?|creatives?|variations?|statics?|banners?|versions?)/);
  if (q?.[1]) out.quantity = Number(q[1]) || WORDS[q[1]] || 1;
  const d = text.match(/\b(?:by|before|due)\s+((?:next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow|end of (?:the )?week|[A-Z][a-z]{2,8}\.? \d{1,2})/i);
  if (d?.[1]) out.deadline = d[1].replace(/^\w/, (c) => c.toUpperCase());
  const a = text.match(/\b(?:audience|targeting|for)\s*(?:is|:)?\s*((?:lapsed|existing|new|young|gen ?z|creators?|music fans|women|men|parents|students)[^,.;]*)/i);
  if (a?.[1]) out.audience = a[1].trim();
  const avoid = text.match(/\bavoid\s+([^.;]+)/i);
  if (avoid?.[1]) out.avoid = avoid[1].trim();
  return out;
}
/** Merge parsed fields; explicitly stated values replace suggestions. */
export function mergeBrief(b: CreativeBrief, patch: Partial<CreativeBrief>) {
  for (const [k, v] of Object.entries(patch) as [keyof CreativeBrief, unknown][]) {
    if (k === "suggested" || v === undefined || v === "") continue;
    (b as unknown as Record<string, unknown>)[k] = v;
    b.suggested = b.suggested.filter((f) => f !== k);
  }
}
export function nextQuestion(b: CreativeBrief): string | null {
  const m = missingFields(b);
  if (!m.length) return null;
  return BRIEF_FIELDS.find((f) => f.key === m[0])?.question ?? null;
}

/* ------------------------------------------------------------------ */
/* Derived statuses, QA and delivery rules                             */
/* ------------------------------------------------------------------ */
export type RequestStatus = "Needs Info" | "Brief Review" | "Ready for Production" | "In Production" | "Awaiting Review" | "Ready to Deliver" | "Delivery Blocked" | "Delivered";

export function requestJobs(s: State, rid: string) {
  return s.productionJobs.filter((j) => j.requestId === rid);
}
/** Latest attempt per production slot. */
export function latestJobs(s: State, r: CreativeRequest) {
  const jobs = requestJobs(s, r.id);
  const slots = [...new Set(jobs.map((j) => j.slot))].sort((a, b) => a - b);
  return slots.map((slot) => jobs.filter((j) => j.slot === slot).sort((a, b) => b.attempt - a.attempt)[0]!).filter(Boolean);
}
export function deliverables(s: State, r: CreativeRequest): { asset: CreativeAsset; version: CreativeVersion; via: "Reused" | "Generated"; jobId?: string }[] {
  const out: { asset: CreativeAsset; version: CreativeVersion; via: "Reused" | "Generated"; jobId?: string }[] = [];
  for (const aid of r.reused) {
    const a = s.creativeAssets.find((x) => x.id === aid && x.clientId === r.clientId);
    const v = a?.versions.find((x) => x.number === a.current);
    if (a && v) out.push({ asset: a, version: v, via: "Reused" });
  }
  for (const j of latestJobs(s, r)) {
    if (j.status !== "Succeeded" || !j.outputAssetId) continue;
    const a = s.creativeAssets.find((x) => x.id === j.outputAssetId && x.clientId === r.clientId);
    const v = a?.versions.find((x) => x.number === a.current);
    if (a && v) out.push({ asset: a, version: v, via: "Generated", jobId: j.id });
  }
  return out;
}
export interface QACheck { name: string; status: "pass" | "fail" | "n/a"; detail: string }
const ratioOf = (format?: string) => format?.match(/\d+:\d+/)?.[0];
/** Technical Output QA — file availability and metadata only, never creative correctness. */
export function outputQA(v: CreativeVersion, requestedFormat?: string): QACheck[] {
  const exists = !!(v.preview || v.mediaKey);
  const want = ratioOf(requestedFormat);
  const checks: QACheck[] = [
    { name: "File exists", status: exists ? "pass" : "fail", detail: exists ? (v.mediaKey ? "Local browser file" : "Illustrative preview file (simulated output)") : "No output file was produced" },
    { name: v.format === "Video" ? "Opens and plays" : "Opens", status: exists && v.validated ? "pass" : "fail", detail: v.validated ? "Opened during validation" : "File could not be opened" },
    { name: "Supported format", status: ["Image", "Video"].includes(v.format) ? "pass" : "fail", detail: v.format === "Video" ? "MP4 · H.264 / AAC (demo metadata)" : "JPG" },
    { name: v.format === "Video" ? "Resolution" : "Dimensions", status: v.width >= 500 && v.height >= 500 ? "pass" : "fail", detail: `${v.width} × ${v.height}` },
    { name: "Aspect ratio", status: !want ? "n/a" : v.ratio === want ? "pass" : "fail", detail: want ? `${v.ratio} (requested ${want})` : v.ratio },
    { name: "File size", status: v.size <= (v.format === "Video" ? 250 : 30) * 1024 * 1024 ? "pass" : "fail", detail: `${(v.size / 1024 / 1024).toFixed(2)} MB` },
  ];
  if (v.format === "Video") checks.push(v.duration === undefined
    ? { name: "Duration", status: "n/a", detail: "Not reported by the source" }
    : { name: "Duration", status: v.duration <= 30 ? "pass" : "fail", detail: v.duration <= 30 ? `${v.duration}s` : `${v.duration}s exceeds the 30s placement limit` });
  checks.push({ name: "Download available", status: exists ? "pass" : "fail", detail: exists ? (v.mediaKey ? "Original file" : "Preview image only — simulated output, not a production file") : "Unavailable" });
  return checks;
}
export const qaPassed = (v: CreativeVersion, f?: string) => outputQA(v, f).every((c) => c.status !== "fail");

/** Everything that prevents verified delivery. Empty = deliverable. */
export function deliveryBlockers(s: State, r: CreativeRequest): string[] {
  const out: string[] = [];
  const qty = r.brief.quantity ?? 0;
  const items = deliverables(s, r);
  for (const j of latestJobs(s, r)) {
    if (j.status !== "Succeeded") out.push(`Output ${j.slot}: job ${j.id} ${j.status === "Failed" ? "failed" : j.status === "Outcome Unknown" ? "outcome unknown" : j.status.toLowerCase()} — no usable output`);
  }
  if (items.length < qty) out.push(`${items.length} of ${qty} required outputs available`);
  for (const { asset, version } of items) {
    const fails = outputQA(version, r.brief.format).filter((c) => c.status === "fail");
    if (fails.length) out.push(`${asset.name} V${version.number}: technical QA failed — ${fails.map((c) => c.detail).join("; ")}`);
    if (version.review !== "Approved") out.push(`${asset.name} V${version.number}: agency creative review ${version.review === "Changes Requested" ? "requested changes" : "not complete"}`);
    else if (!effectiveApproval(asset, version)) out.push(`${asset.name} V${version.number}: client approval required`);
  }
  return [...new Set(out)];
}
export function requestStatus(s: State, r: CreativeRequest): RequestStatus {
  if (r.deliveredAt) return "Delivered";
  if (missingFields(r.brief).length) return "Needs Info";
  if (!r.confirmed) return "Brief Review";
  if (!r.submitted) return "Ready for Production";
  const latest = latestJobs(s, r);
  if (latest.some((j) => j.status === "Queued" || j.status === "Running")) return "In Production";
  const items = deliverables(s, r);
  const missing = latest.some((j) => j.status !== "Succeeded") || items.length < (r.brief.quantity ?? 0);
  const qaFail = items.some((d) => !qaPassed(d.version, r.brief.format));
  if (missing || qaFail) return "Delivery Blocked";
  if (items.some((d) => !effectiveApproval(d.asset, d.version))) return "Awaiting Review";
  return "Ready to Deliver";
}
export const STATUS_TONE: Record<RequestStatus, "success" | "warning" | "info" | "danger" | "muted" | "brand"> = {
  "Needs Info": "warning", "Brief Review": "brand", "Ready for Production": "info", "In Production": "info",
  "Awaiting Review": "warning", "Ready to Deliver": "success", "Delivery Blocked": "danger", Delivered: "success",
};
export const SUMMARY_CARDS: { label: string; statuses: RequestStatus[] }[] = [
  { label: "Needs Info", statuses: ["Needs Info"] },
  { label: "Ready for Production", statuses: ["Brief Review", "Ready for Production"] },
  { label: "In Production", statuses: ["In Production"] },
  { label: "Awaiting Review", statuses: ["Awaiting Review", "Ready to Deliver"] },
  { label: "Failed / Blocked", statuses: ["Delivery Blocked"] },
];
export const REQUEST_VIEWS: { label: string; statuses: RequestStatus[] | null }[] = [
  { label: "All Requests", statuses: null },
  { label: "Needs Info", statuses: ["Needs Info"] },
  { label: "In Progress", statuses: ["Brief Review", "Ready for Production", "In Production", "Delivery Blocked"] },
  { label: "Awaiting Review", statuses: ["Awaiting Review", "Ready to Deliver"] },
  { label: "Delivered", statuses: ["Delivered"] },
];
export function estimateCost(r: CreativeRequest) {
  const per = r.brief.format?.includes("video") ? 1.8 : 0.4;
  return Math.round(per * Math.max(0, (r.brief.quantity ?? 0) - r.reused.length) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Mutations (called inside update())                                  */
/* ------------------------------------------------------------------ */
const iso = () => new Date().toISOString();
function nid(s: State, p: string) {
  s.seq += 1;
  return `${p}-${s.seq}`;
}
export function logReq(r: CreativeRequest, actor: string, kind: RequestEvent["kind"], action: string) {
  r.updatedAt = iso();
  r.events.unshift({ at: r.updatedAt, actor, kind, action });
}
/** Approved assets in the same client, offered for reuse before generation (videos and Drive first). */
export function suggestReuse(s: State, clientId: string, format?: string): string[] {
  const video = !format || format.includes("video");
  return s.creativeAssets
    .filter((a) => a.clientId === clientId && a.versions.find((v) => v.number === a.current)?.review === "Approved")
    .sort((a, b) => Number(!!b.drive) - Number(!!a.drive) || Number((b.versions[0]?.format === "Video") === video) - Number((a.versions[0]?.format === "Video") === video))
    .slice(0, 3)
    .map((a) => a.id);
}
export function createRequest(
  s: State,
  input: { clientId: string; text: string; actor: string; owner: string; source: CreativeRequest["source"]; name?: string; campaignId?: string; prefill?: Partial<CreativeBrief>; scenario?: boolean; brand?: { audience: string; description: string; market: string } },
): CreativeRequest {
  const brand = s.brands[input.clientId] ?? input.brand;
  const brief: CreativeBrief = { suggested: [] };
  // Agent reads Client / Brand context first (marked as suggestions).
  if (brand) {
    brief.audience = brand.audience; brief.sellingPoint = brand.description; brief.market = brand.market;
    brief.suggested.push("audience", "sellingPoint", "market");
  }
  // Suggested from the client's active channel (all demo clients currently run on Meta).
  brief.platform = "Meta"; brief.suggested.push("platform");
  const due = new Date(Date.now() + 3 * 86400000).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  brief.deadline = due; brief.suggested.push("deadline");
  mergeBrief(brief, input.prefill ?? {});
  mergeBrief(brief, parseBrief(input.text));
  const clientName = s.clients.find((c) => c.id === input.clientId)?.name ?? input.clientId;
  const r: CreativeRequest = {
    id: nid(s, "CR"),
    clientId: input.clientId,
    name: input.name?.trim() || `${clientName} — ${brief.quantity ?? ""} ${brief.objective ?? "new"} ${brief.format?.includes("video") ? "video concepts" : "creatives"}`.replace(/\s+/g, " "),
    owner: input.owner,
    requestedBy: input.actor,
    createdAt: iso(),
    updatedAt: iso(),
    source: input.source,
    brief,
    references: [],
    reused: [],
    suggestedAssets: suggestReuse(s, input.clientId, brief.format),
    confirmed: false,
    submitted: false,
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    ...(input.scenario ? { scenario: true } : {}),
    intake: [{ from: "human", by: input.actor, text: input.text, at: iso() }],
    events: [],
  };
  logReq(r, input.actor, "Human", `Request created from ${input.source}`);
  agentFollowUp(s, r);
  s.creativeRequests.unshift(r);
  return r;
}
function agentFollowUp(s: State, r: CreativeRequest) {
  const q = nextQuestion(r.brief);
  const found = r.suggestedAssets.length;
  const reuse = found && !r.intake.some((m) => m.from === "agent")
    ? ` I found ${found} approved asset${found > 1 ? "s" : ""} in ${s.clients.find((c) => c.id === r.clientId)?.name}'s library you could reuse as references or deliverables.`
    : "";
  const text = q ? `${q}${reuse}` : `The brief is complete — please review the Brief Card and confirm before production.${reuse}`;
  r.intake.push({ from: "agent", by: r.owner, text, at: iso() });
  logReq(r, r.owner, "Agent", q ? `Needs Info — asked: “${q}”` : "Brief prepared for confirmation");
}
export function answerIntake(s: State, r: CreativeRequest, actor: string, text: string) {
  if (r.submitted || !text.trim()) return;
  r.intake.push({ from: "human", by: actor, text: text.trim(), at: iso() });
  const before = missingFields(r.brief);
  const parsed = parseBrief(text);
  // A bare answer fills the field that was asked about.
  const asked = before[0];
  if (asked && parsed[asked] === undefined && asked !== "quantity") (parsed as Record<string, unknown>)[asked] = text.trim().replace(/^@?Creative Agent[,:\s]*/i, "");
  mergeBrief(r.brief, parsed);
  r.confirmed = false;
  logReq(r, actor, "Human", "Brief updated");
  agentFollowUp(s, r);
}
export function produce(s: State, r: CreativeRequest, actor: string) {
  if (r.submitted || !r.confirmed || missingFields(r.brief).length) return false;
  r.submitted = true;
  const n = Math.max(0, (r.brief.quantity ?? 0) - r.reused.length);
  for (let slot = 1; slot <= n; slot++) addJob(s, r, slot, 1);
  logReq(r, actor, "Human", `Submitted for production — ${n} job${n === 1 ? "" : "s"} queued (estimated ${estimateCost(r).toFixed(2)} USD)`);
  if (n === 0) logReq(r, "System", "System", "All outputs covered by reused approved assets — no generation needed");
  return true;
}
function addJob(s: State, r: CreativeRequest, slot: number, attempt: number, retryOf?: string) {
  const video = !!r.brief.format?.includes("video");
  s.productionJobs.push({
    id: nid(s, "JOB"), requestId: r.id, clientId: r.clientId, slot, attempt, ...(retryOf ? { retryOf } : {}),
    inputs: [...r.references], provider: video ? "Simulated video model (demo)" : "Simulated image model (demo)",
    format: r.brief.format ?? "", status: "Queued", queuedAt: iso(), cost: { amount: video ? 1.8 : 0.4, state: "Estimated" },
  });
}
/** Advance queued → running → outcome. Deterministic demo outcomes. */
export function advanceJobs(s: State, rid: string) {
  const r = s.creativeRequests.find((x) => x.id === rid);
  if (!r) return;
  for (const j of s.productionJobs.filter((j) => j.requestId === rid)) {
    if (j.status === "Queued") { j.status = "Running"; j.startedAt = iso(); continue; }
    if (j.status !== "Running") continue;
    j.finishedAt = iso();
    if (r.scenario && j.slot === 2 && j.attempt === 1) {
      j.status = "Failed";
      j.error = { message: "Provider error — cause not yet confirmed.", causeKnown: false, outputProduced: false, retryable: true };
      j.cost = { amount: null, state: "Unknown / Pending Reconciliation" };
      logReq(r, "System", "System", `Job ${j.id} failed — provider error, cause not yet confirmed. No output produced.`);
      continue;
    }
    j.status = "Succeeded";
    j.cost = { amount: j.cost.amount, state: "Confirmed" };
    j.outputAssetId = createOutput(s, r, j, r.scenario && j.slot === 3 && j.attempt === 1 ? 34 : 15);
    logReq(r, "Creative Agent", "Agent", `Job ${j.id} succeeded — output ${j.outputAssetId} generated and sent to Output QA`);
  }
  syncTask(s, r);
}
function createOutput(s: State, r: CreativeRequest, j: ProductionJob, duration: number) {
  const video = !!r.brief.format?.includes("video");
  const ratio = ratioOf(r.brief.format) ?? "1:1";
  const v = makeVersion(CREATIVE_PREVIEWS[(j.slot + 5 + (r.clientId === "clientb" ? 6 : 0)) % CREATIVE_PREVIEWS.length] ?? "", 1, "In Review");
  Object.assign(v, {
    format: video ? "Video" : "Image", ratio, width: ratio === "9:16" ? 1080 : 1080, height: ratio === "9:16" ? 1920 : ratio === "4:5" ? 1350 : 1080,
    size: video ? 6_400_000 : 900_000, by: "Creative Agent", createdAt: iso(), change: `Generated for ${r.id} · ${j.id} (attempt ${j.attempt})`, material: true,
  });
  if (video) v.duration = duration;
  v.audit.push({ at: iso(), actor: "Creative Agent", action: `Generated by ${j.provider} for request ${r.id}; awaiting technical QA and human review` });
  const aid = nid(s, "A");
  s.creativeAssets.unshift({
    id: aid, clientId: r.clientId, name: `${r.name} · Concept ${j.slot}`, source: "AI Generated", channel: r.brief.platform ?? "Meta",
    tags: ["Request", r.brief.objective ?? "Creative"], current: 1, reviewer: "david", clientRequired: false, versions: [v], requestId: r.id,
  });
  return aid;
}
export function retryJob(s: State, jid: string, actor: string) {
  const j = s.productionJobs.find((x) => x.id === jid);
  const r = s.creativeRequests.find((x) => x.id === j?.requestId);
  if (!j || !r || r.deliveredAt || !["Failed", "Outcome Unknown", "Cancelled"].includes(j.status)) return;
  if (latestJobs(s, r).find((x) => x.slot === j.slot)?.id !== j.id) return;
  addJob(s, r, j.slot, j.attempt + 1, j.id);
  logReq(r, actor, "Human", `Retry requested for ${j.id} — new attempt ${j.attempt + 1} queued; original record preserved`);
}
export function cancelJob(s: State, jid: string, actor: string) {
  const j = s.productionJobs.find((x) => x.id === jid);
  const r = s.creativeRequests.find((x) => x.id === j?.requestId);
  if (!j || !r || !["Queued", "Running"].includes(j.status)) return;
  j.status = "Cancelled"; j.finishedAt = iso();
  j.cost = { amount: j.startedAt ? null : 0, state: j.startedAt ? "Unknown / Pending Reconciliation" : "Confirmed" };
  logReq(r, actor, "Human", `Cancelled ${j.id}`);
}
export function deliver(s: State, r: CreativeRequest, actor: string) {
  if (r.deliveredAt || deliveryBlockers(s, r).length || requestStatus(s, r) !== "Ready to Deliver") return false;
  r.deliveredAt = iso(); r.deliveredBy = actor;
  logReq(r, actor, "Human", `Final delivery verified — ${deliverables(s, r).length} outputs passed technical QA and approvals`);
  syncTask(s, r);
  return true;
}
export function syncTask(s: State, r: CreativeRequest) {
  const t = s.tasks.find((x) => x.id === r.taskId);
  if (!t) return;
  const st = requestStatus(s, r);
  t.status = st === "Delivered" ? "completed" : st === "Delivery Blocked" ? "blocked" : st === "In Production" ? "running" : "waiting_approval";
  if (st === "Delivered") { t.stage = t.stages.length; t.result = `Request ${r.id} delivered (simulated outputs).`; }
}

/* ------------------------------------------------------------------ */
/* Google Drive (simulated, one-way inbound)                           */
/* ------------------------------------------------------------------ */
export const DRIVE_ACCOUNT = "creative-ops@bluefocus.example (simulated)";
export function orgName(s: State) { return s.biz === "direct" ? s.clients.find((c) => c.id === "direct")?.name ?? "Northwind Coffee" : "BlueFocus"; }
function driveAsset(s: State, f: DriveFile, folder: DriveFolder, clientId: string): CreativeAsset {
  const v = makeVersion(f.preview, 1, "Draft");
  Object.assign(v, { format: f.format, ratio: Math.abs(f.width / f.height - 1) < 0.05 ? "1:1" : f.width < f.height ? (Math.abs(f.width / f.height - 0.8) < 0.05 ? "4:5" : "9:16") : "16:9", width: f.width, height: f.height, size: f.size, by: "Google Drive import", createdAt: iso(), change: `Imported from Drive (revision ${f.revision})` });
  if (f.duration !== undefined) v.duration = f.duration;
  v.audit.push({ at: iso(), actor: "System", action: `Imported from Google Drive folder “${folder.name}” · file ${f.id} rev ${f.revision}` });
  return {
    id: nid(s, "GD"), clientId, name: f.name.replace(/\.[^.]+$/, ""), source: "Uploaded", channel: "Meta", tags: ["Google Drive"], current: 1,
    reviewer: "david", clientRequired: false, versions: [v],
    drive: { fileId: f.id, folderId: folder.id, folderName: folder.name, account: s.drive.account, fileName: f.name, modifiedAt: f.modifiedAt, syncedAt: iso(), revision: f.revision, status: "Synced" },
  };
}
export interface DriveResult { imported: string[]; skipped: string[]; updated: string[]; failed: { name: string; reason: string }[]; error?: string }
export function canImportDrive(s: State) { return s.role === "admin" || s.role === "member"; }
/** Import selected files into the folder's mapped client. Failures never block successful files. */
export function importDrive(s: State, folderId: string, fileIds: string[], clientId: string): DriveResult {
  const res: DriveResult = { imported: [], skipped: [], updated: [], failed: [] };
  const folder = s.drive.folders.find((f) => f.id === folderId);
  if (!canImportDrive(s)) return { ...res, error: "Your role cannot import assets." };
  if (!s.drive.connected) return { ...res, error: "Google Drive is not connected." };
  if (!folder || folder.clientId !== clientId) return { ...res, error: "This folder is not mapped to the selected client." };
  if (folder.accessRevoked) { folder.status = "Authorization Required"; return { ...res, error: "Authorization Required — the connection no longer has access to this folder." }; }
  for (const fid of fileIds) {
    const f = s.drive.files.find((x) => x.id === fid && x.folderId === folderId);
    if (!f) continue;
    if (f.removed) { res.failed.push({ name: f.name, reason: "Source Unavailable / Removed from Drive" }); continue; }
    if (f.unreadable) { res.failed.push({ name: f.name, reason: f.unreadable }); upsertError(folder, f, f.unreadable); continue; }
    const existing = s.creativeAssets.find((a) => a.drive?.fileId === f.id && a.clientId === clientId);
    if (existing && existing.drive) {
      if (existing.drive.revision >= f.revision) { res.skipped.push(f.name); existing.drive.syncedAt = iso(); continue; }
      applySourceRevision(s, existing, f);
      res.updated.push(f.name);
      continue;
    }
    s.creativeAssets.unshift(driveAsset(s, f, folder, clientId));
    folder.errors = folder.errors.filter((e) => e.fileId !== f.id);
    res.imported.push(f.name);
  }
  return res;
}
function upsertError(folder: DriveFolder, f: DriveFile, reason: string) {
  folder.errors = [...folder.errors.filter((e) => e.fileId !== f.id), { fileId: f.id, name: f.name, reason }];
}
/** Source changed: never overwrite an approved or campaign-assigned version. */
function applySourceRevision(s: State, a: CreativeAsset, f: DriveFile) {
  if (!a.drive) return;
  const cur = a.versions.find((v) => v.number === a.current);
  const protectedVersion = cur?.review === "Approved" || s.creativeUsage.some((u) => u.creativeId === a.id);
  if (protectedVersion) {
    a.drive.status = "Source update available"; a.drive.pendingRevision = f.revision; a.drive.syncedAt = iso();
    a.versions.find((v) => v.number === a.current)?.audit.push({ at: iso(), actor: "System", action: `Drive source revision ${f.revision} detected — held for review; approved V${a.current} unchanged` });
    return;
  }
  addSourceVersion(a, f);
}
function addSourceVersion(a: CreativeAsset, f: DriveFile) {
  if (!a.drive) return;
  const v = makeVersion(f.preview, Math.max(...a.versions.map((x) => x.number)) + 1, "In Review");
  Object.assign(v, { format: f.format, width: f.width, height: f.height, size: f.size, by: "Google Drive sync", createdAt: iso(), change: `Drive source revision ${f.revision}`, material: true, ratio: a.versions[0]?.ratio ?? "9:16" });
  if (f.duration !== undefined) v.duration = f.duration;
  v.audit.push({ at: iso(), actor: "System", action: `New version from Drive revision ${f.revision}; prior approval not inherited` });
  a.versions.push(v); a.current = v.number;
  a.drive.revision = f.revision; a.drive.modifiedAt = f.modifiedAt; a.drive.syncedAt = iso(); a.drive.status = "Synced";
  delete a.drive.pendingRevision;
}
export function reviewSourceUpdate(s: State, aid: string) {
  const a = s.creativeAssets.find((x) => x.id === aid);
  const f = s.drive.files.find((x) => x.id === a?.drive?.fileId);
  if (!a?.drive || !f || a.drive.status !== "Source update available" || !canImportDrive(s)) return;
  addSourceVersion(a, f);
}
export function syncFolder(s: State, folderId: string): DriveResult {
  const folder = s.drive.folders.find((f) => f.id === folderId);
  const empty: DriveResult = { imported: [], skipped: [], updated: [], failed: [] };
  if (!folder || !folder.clientId) return { ...empty, error: "Folder is not mapped to a client." };
  if (!s.drive.connected || folder.accessRevoked) {
    folder.status = "Authorization Required";
    return { ...empty, error: "Authorization Required — reconnect Google Drive to resume sync." };
  }
  const files = s.drive.files.filter((f) => f.folderId === folderId);
  for (const f of files.filter((f) => f.removed)) {
    const a = s.creativeAssets.find((x) => x.drive?.fileId === f.id);
    if (a?.drive) a.drive.status = "Source Unavailable / Removed from Drive";
  }
  const res = importDrive(s, folderId, files.filter((f) => !f.removed).map((f) => f.id), folder.clientId);
  folder.synced = true;
  folder.lastSynced = iso();
  folder.lastResult = { imported: res.imported.length, skipped: res.skipped.length, updated: res.updated.length, failed: res.failed.length };
  folder.status = res.failed.length ? "Partial failure" : "Synced";
  return res;
}

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */
const P = CREATIVE_PREVIEWS;
export function seedDrive(): DriveState {
  const at = "2026-11-08T15:00:00Z";
  const file = (id: string, folderId: string, name: string, format: "Image" | "Video", preview: number, extra: Partial<DriveFile> = {}): DriveFile => ({
    id, folderId, name, format, mime: format === "Video" ? "video/mp4" : "image/jpeg", width: format === "Video" ? 1080 : 1080, height: format === "Video" ? 1920 : 1080,
    size: format === "Video" ? 18_400_000 : 1_200_000, modifiedAt: at, revision: 1, removed: false, preview: P[preview] ?? "", ...(format === "Video" ? { duration: 15 } : {}), ...extra,
  });
  return {
    connected: false,
    account: DRIVE_ACCOUNT,
    folders: [
      { id: "DRV-FB", name: "Freebeat Campaign Assets", clientId: "freebeat", synced: false, status: "Not synced", accessRevoked: false, errors: [] },
      { id: "DRV-FB-ARCH", name: "Freebeat Archive 2025", clientId: "freebeat", synced: false, status: "Not synced", accessRevoked: false, errors: [] },
      { id: "DRV-CB", name: "Client B Product Shots", clientId: "clientb", synced: false, status: "Not synced", accessRevoked: false, errors: [] },
      { id: "DRV-SHARED", name: "Agency Shared — Stock", clientId: null, synced: false, status: "Not synced", accessRevoked: false, errors: [] },
      { id: "DRV-NW", name: "Northwind Café Photos", clientId: "direct", synced: false, status: "Not synced", accessRevoked: false, errors: [] },
    ],
    files: [
      file("gd_fb_01", "DRV-FB", "fb_hero_creator.jpg", "Image", 0),
      file("gd_fb_02", "DRV-FB", "fb_app_screens.jpg", "Image", 4),
      file("gd_fb_03", "DRV-FB", "fb_beat_drop_static.jpg", "Image", 8, { width: 1080, height: 1350 }),
      file("gd_fb_04", "DRV-FB", "fb_holiday_key_visual.jpg", "Image", 9),
      file("gd_fb_05", "DRV-FB", "fb_product_demo_15s.mp4", "Video", 1),
      file("gd_fb_06", "DRV-FB", "fb_creator_duet_20s.mp4", "Video", 2, { duration: 20 }),
      file("gd_fb_07", "DRV-FB", "fb_ugc_cut_v3.mov", "Video", 3, { mime: "video/quicktime", unreadable: "Validation failed: video container could not be opened" }),
      file("gd_fba_01", "DRV-FB-ARCH", "fb_2025_launch_teaser.mp4", "Video", 10),
      file("gd_cb_01", "DRV-CB", "cb_serum_flatlay.jpg", "Image", 12),
      file("gd_cb_02", "DRV-CB", "cb_routine_steps.jpg", "Image", 13, { width: 1080, height: 1350 }),
      file("gd_cb_03", "DRV-CB", "cb_texture_closeup.jpg", "Image", 13),
      file("gd_sh_01", "DRV-SHARED", "stock_studio_lights.jpg", "Image", 5),
      file("gd_nw_01", "DRV-NW", "nw_latte_art.jpg", "Image", 14),
      file("gd_nw_02", "DRV-NW", "nw_morning_counter.jpg", "Image", 14),
    ],
  };
}
export function seedCreativeOps(assets: CreativeAsset[]): { requests: CreativeRequest[]; jobs: ProductionJob[] } {
  const at = (d: number) => new Date(Date.parse("2026-11-09T10:00:00Z") - d * 3600000).toISOString();
  const brief = (b: Partial<CreativeBrief>): CreativeBrief => ({ audience: "Creators and music fans aged 18–34", sellingPoint: "Turn any track into a beat-synced video in seconds", market: "US · English", suggested: [], ...b });
  const req = (r: Partial<CreativeRequest> & Pick<CreativeRequest, "id" | "clientId" | "name" | "brief">): CreativeRequest => ({
    owner: "Creative Agent", requestedBy: "Sarah Linden", createdAt: at(30), updatedAt: at(2), source: "Creative page", references: [], reused: [], suggestedAssets: [], confirmed: true, submitted: true, intake: [], events: [], ...r,
  });
  const a7 = assets.find((a) => a.id === "A-07");
  if (a7) a7.requestId = "CR-201";
  const requests: CreativeRequest[] = [
    req({ id: "CR-201", clientId: "freebeat", name: "Freebeat — Three UGC video variations", brief: brief({ objective: "User Acquisition", platform: "Meta", format: "9:16 vertical video", quantity: 3, deadline: "Fri Nov 13", direction: "Native creator-led openings, captions on" }), references: ["A-01"],
      events: [
        { at: at(3), actor: "System", kind: "System", action: "Job JOB-201B failed — provider error, cause not yet confirmed. No output produced." },
        { at: at(4), actor: "Creative Agent", kind: "Agent", action: "Job JOB-201A succeeded — output A-07 generated" },
        { at: at(5), actor: "Sarah Linden", kind: "Human", action: "Submitted for production — 3 jobs queued (estimated 5.40 USD)" },
        { at: at(6), actor: "Sarah Linden", kind: "Human", action: "Brief confirmed" },
        { at: at(30), actor: "Sarah Linden", kind: "Human", action: "Request created from Creative page" },
      ] }),
    req({ id: "CR-202", clientId: "freebeat", name: "Freebeat — Holiday static set", confirmed: false, submitted: false, brief: brief({ platform: "Meta", format: "1:1 static image", quantity: 4 }),
      intake: [{ from: "human", by: "Sarah Linden", text: "Need four holiday statics for Meta.", at: at(8) }, { from: "agent", by: "Creative Agent", text: BRIEF_FIELDS[0]!.question, at: at(8) }],
      events: [{ at: at(8), actor: "Creative Agent", kind: "Agent", action: `Needs Info — asked: “${BRIEF_FIELDS[0]!.question}”` }, { at: at(8), actor: "Sarah Linden", kind: "Human", action: "Request created from Creative page" }] }),
    req({ id: "CR-203", clientId: "freebeat", name: "Freebeat — Retargeting refresh (reuse)", brief: brief({ objective: "Retargeting", platform: "Meta", format: "9:16 vertical video", quantity: 2, deadline: "Mon Nov 9" }), reused: ["A-01", "A-02"], deliveredAt: at(20), deliveredBy: "Maya Chen",
      events: [{ at: at(20), actor: "Maya Chen", kind: "Human", action: "Final delivery verified — 2 outputs passed technical QA and approvals" }, { at: at(26), actor: "Creative Agent", kind: "Agent", action: "Suggested reusing 2 approved videos instead of generating" }] }),
    req({ id: "CR-204", clientId: "freebeat", name: "Freebeat — Creator duet cutdowns", submitted: false, brief: brief({ objective: "Awareness", platform: "TikTok Ads", format: "9:16 vertical video", quantity: 2, deadline: "Wed Nov 18" }),
      events: [{ at: at(10), actor: "Sarah Linden", kind: "Human", action: "Brief confirmed" }] }),
    req({ id: "CR-205", clientId: "clientb", name: "Client B — Serum product statics", requestedBy: "Maya Chen", brief: brief({ objective: "Conversion / Sales", audience: "Women 25–44 in urban US", sellingPoint: "Clean daily serum routine", platform: "Meta", format: "1:1 static image", quantity: 1, deadline: "Thu Nov 12" }),
      events: [{ at: at(5), actor: "System", kind: "System", action: "Job JOB-205A outcome unknown — provider did not return a final result" }] }),
    req({ id: "CR-206", clientId: "direct", name: "Northwind — Morning menu statics", owner: "AI AM", requestedBy: "Jordan Lee", confirmed: false, submitted: false, brief: { audience: "Local commuters and remote workers", sellingPoint: "Specialty coffee, 3 cafés", market: "Seattle, WA", platform: "Meta", format: "1:1 static image", quantity: 2, suggested: [] },
      intake: [{ from: "human", by: "Jordan Lee", text: "Two morning menu images for Instagram.", at: at(6) }, { from: "agent", by: "AI AM", text: "Is this to reach new customers or bring back regulars? And when do you need them?", at: at(6) }] }),
  ];
  const jobs: ProductionJob[] = [
    { id: "JOB-201A", requestId: "CR-201", clientId: "freebeat", slot: 1, attempt: 1, inputs: ["A-01"], provider: "Simulated video model (demo)", format: "9:16 vertical video", status: "Succeeded", queuedAt: at(5), startedAt: at(5), finishedAt: at(4), outputAssetId: "A-07", cost: { amount: 1.8, state: "Confirmed" } },
    { id: "JOB-201B", requestId: "CR-201", clientId: "freebeat", slot: 2, attempt: 1, inputs: ["A-01"], provider: "Simulated video model (demo)", format: "9:16 vertical video", status: "Failed", queuedAt: at(5), startedAt: at(5), finishedAt: at(3), error: { message: "Provider error — cause not yet confirmed.", causeKnown: false, outputProduced: false, retryable: true }, cost: { amount: null, state: "Unknown / Pending Reconciliation" } },
    { id: "JOB-201C", requestId: "CR-201", clientId: "freebeat", slot: 3, attempt: 1, inputs: ["A-01"], provider: "Simulated video model (demo)", format: "9:16 vertical video", status: "Running", queuedAt: at(5), startedAt: at(2), cost: { amount: 1.8, state: "Estimated" } },
    { id: "JOB-205A", requestId: "CR-205", clientId: "clientb", slot: 1, attempt: 1, inputs: [], provider: "Simulated image model (demo)", format: "1:1 static image", status: "Outcome Unknown", queuedAt: at(6), startedAt: at(6), finishedAt: at(5), error: { message: "Provider did not return a final result before timeout. Check whether an output exists before retrying.", causeKnown: false, outputProduced: false, retryable: true }, cost: { amount: null, state: "Unknown / Pending Reconciliation" } },
  ];
  return { requests, jobs };
}
