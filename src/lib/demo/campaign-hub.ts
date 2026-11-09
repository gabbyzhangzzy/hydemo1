/* ------------------------------------------------------------------ */
/* Campaign Operations Hub — unified view model                        */
/*                                                                     */
/* Merges the two real data sources into one list without duplicating  */
/* them:                                                               */
/*  - Delivery campaigns: CAMPAIGNS + ROWS from analytics-data (same   */
/*    dataset Analytics uses, so numbers always reconcile).            */
/*  - Workflow proposals: store Campaign records (main + drafts).      */
/* Proposals never show invented performance; delivery campaigns never */
/* show workflow actions.                                              */
/* ------------------------------------------------------------------ */

import type { Agg, CampaignMeta, AnalyticsFilters } from "./analytics-data";
import { campaignTable, fmtMoney, fmtNum } from "./analytics-data";
import type { Campaign, State } from "./store";
import { STATUS_FLOW, STATUS_LABEL, readiness } from "./store";
import { effectiveApproval } from "./creative-model";

export type HubGroup = "active" | "draft" | "completed";
export interface ResultMetric {
  label: string; // e.g. "Purchases", "Leads", "Reach", "Clicks"
  value: string;
  costLabel: string; // e.g. "CPA", "CPL", "Cost / 1K reach", "CPC"
  cost: string;
}

export interface UnifiedCampaign {
  id: string;
  clientId: string;
  name: string;
  channel: string;
  objective: string;
  /** Primary, human-readable status. */
  statusLabel: string;
  statusTone: "success" | "warning" | "info" | "danger" | "muted" | "brand";
  group: HubGroup;
  budget: string;
  updated: string;
  /** Attention reasons; empty = healthy. */
  attention: string[];
  kind: "delivery" | "proposal";
  meta?: CampaignMeta;
  proposal?: Campaign;
  agg?: Agg; // delivery campaigns only, under current filters
  result?: ResultMetric;
}

/** Objective-aware result metric. Unavailable data is N/A, never zero. */
export function objectiveResult(objective: string, a: Agg, conversionsAvailable: boolean): ResultMetric {
  if (objective === "Awareness") {
    return { label: "Reach", value: fmtNum(a.reach), costLabel: "Cost / 1K reach", cost: a.reach > 0 ? fmtMoney((a.spend / a.reach) * 1000) : "N/A" };
  }
  if (objective === "Traffic") {
    return { label: "Clicks", value: fmtNum(a.clicks), costLabel: "CPC", cost: a.clicks > 0 ? fmtMoney(a.cpc) : "N/A" };
  }
  if (!conversionsAvailable) {
    return { label: objective === "Leads" ? "Leads" : "Purchases", value: "N/A", costLabel: objective === "Leads" ? "CPL" : "CPA", cost: "N/A" };
  }
  return {
    label: objective === "Leads" ? "Leads" : "Purchases",
    value: fmtNum(a.conversions),
    costLabel: objective === "Leads" ? "CPL" : "CPA",
    cost: a.cpa == null ? "N/A" : fmtMoney(a.cpa),
  };
}

function proposalUnified(s: State, c: Campaign): UnifiedCampaign {
  const idx = STATUS_FLOW.indexOf(c.status);
  const inFlight = idx >= STATUS_FLOW.indexOf("submitted") && c.status !== "live_verified";
  const group: HubGroup = c.status === "draft" || c.status === "awaiting_approval" ? "draft" : "active";
  const attention: string[] = [];
  if (c.status === "awaiting_approval") attention.push(`Awaiting Admin approval · Revision ${c.revision}`);
  if (c.status === "draft" && c.changesRequested) attention.push(`Changes requested: ${c.changesRequested}`);
  if (c.status === "approved") {
    if (c.approvedRevision !== c.revision) attention.push("Approved revision is stale — re-approval required");
    else if (c.id === s.campaign?.id) {
      const missing = readiness(s).filter((r) => !r.ok);
      if (missing.length > 0) attention.push(`Launch blocked: ${missing.map((m) => m.label).join(", ")}`);
    }
  }
  // Creative eligibility: assigned versions must be effectively approved.
  const badCreative = s.creativeUsage
    .filter((u) => u.campaignId === c.id)
    .map((u) => {
      const a = s.creativeAssets.find((x) => x.id === u.creativeId);
      const v = a?.versions.find((x) => x.number === u.version);
      return a && v && !effectiveApproval(a, v) ? `${a.name} V${v.number}` : null;
    })
    .filter((x): x is string => !!x);
  if (badCreative.length > 0) attention.push(`Creative review required: ${badCreative.join(", ")}`);

  let statusLabel = STATUS_LABEL[c.status];
  if (c.status === "draft" && c.changesRequested) statusLabel = "Changes Requested";
  if (inFlight && c.status === "delivery_pending" && s.pageAccess !== "connected") statusLabel = "Delivery Pending — Authorization Issue";
  return {
    id: c.id, clientId: c.clientId, name: c.name, channel: c.platform, objective: c.objective,
    statusLabel,
    statusTone: c.status === "live_verified" ? "success" : c.status === "awaiting_approval" ? "warning" : c.status === "draft" ? (c.changesRequested ? "danger" : "muted") : "info",
    group, budget: `$${c.dailyBudget}/day · cap $${c.totalCap.toLocaleString()}`, updated: `Rev ${c.revision}`,
    attention, kind: "proposal", proposal: c,
  };
}

function deliveryUnified(meta: CampaignMeta, a: Agg): UnifiedCampaign {
  return {
    id: meta.id, clientId: meta.clientId, name: meta.name, channel: meta.channel, objective: meta.objective,
    statusLabel: meta.status, statusTone: meta.status === "Active" ? "success" : meta.status === "Paused" ? "warning" : "muted",
    group: meta.status === "Completed" ? "completed" : "active",
    budget: `$${meta.dailyBudget}/day`, updated: meta.updated,
    attention: [], kind: "delivery", meta, agg: a,
    result: objectiveResult(meta.objective, a, meta.conversionsAvailable),
  };
}

/** Unified campaign list for the hub table. Metrics come from the shared analytics dataset. */
export function unifiedCampaigns(s: State, clientIds: string[], f: AnalyticsFilters): UnifiedCampaign[] {
  const table = new Map(campaignTable(clientIds, f).map((r) => [r.meta.id, r]));
  const delivery = table.size
    ? [...table.values()].map((r) => deliveryUnified(r.meta, r))
    : [];
  const proposals = allProposalsScoped(s, clientIds).map((c) => proposalUnified(s, c));
  return [...proposals, ...delivery];
}

function allProposalsScoped(s: State, clientIds: string[]): Campaign[] {
  return [s.campaign, ...s.drafts].filter((c): c is Campaign => !!c && clientIds.includes(c.clientId));
}

/* ------------------------- Needs Your Attention -------------------- */
export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  to: string;
  search?: Record<string, string | number>;
  askAgent?: "UA Agent" | "Clayton" | "Creative Agent";
  campaignId?: string;
}

export function attentionItems(s: State, clientIds: string[]): AttentionItem[] {
  const out: AttentionItem[] = [];
  for (const c of allProposalsScoped(s, clientIds)) {
    const u = proposalUnified(s, c);
    for (const reason of u.attention) {
      const isApproval = reason.startsWith("Awaiting Admin approval");
      const isCreative = reason.startsWith("Creative review required");
      out.push({
        id: `${c.id}-${reason.slice(0, 12)}`,
        title: isApproval ? "Campaign Awaiting Approval" : isCreative ? "Creative Review Required" : reason.startsWith("Launch blocked") ? "Launch Blocked" : "Campaign Needs Changes",
        detail: `${c.name} — ${reason}`,
        actionLabel: isApproval ? "Review Approval" : isCreative ? "Review Creative" : reason.startsWith("Launch blocked") ? "Resolve Blocker" : "Open Campaign",
        to: isCreative ? "/creative" : `/campaigns/${c.id}`,
        campaignId: c.id,
      });
    }
  }
  if (clientIds.includes("freebeat") && s.pageAccess !== "connected" && s.campaign) {
    out.push({
      id: "page-access",
      title: "Account Authorization Required",
      detail: s.pageAccess === "pending_support" ? "Meta Page access — support case in progress" : "Meta Page access is missing — launch is blocked",
      actionLabel: "Resolve Blocker",
      to: `/campaigns/${s.campaign.id}`,
      campaignId: s.campaign.id,
    });
  }
  return out;
}
