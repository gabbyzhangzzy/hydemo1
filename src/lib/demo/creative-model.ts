export type ReviewStatus = "Draft" | "In Review" | "Changes Requested" | "Approved" | "Archived";
export type DeliveryStatus = "Not Assigned" | "Ready to Launch" | "Scheduled / Pending" | "Active" | "Paused" | "Completed";
export interface CreativeComment { id: string; text: string; by: string; at: string; resolved: boolean; parentId?: string; }
export interface CreativeAudit { at: string; actor: string; action: string; checks?: { name: string; passed: boolean }[]; }
export interface CreativeVersion {
  number: number; preview: string; mediaKey?: string; format: "Image" | "Video"; ratio: string; size: number;
  width: number; height: number; duration?: number; createdAt: string; by: string; change: string;
  review: ReviewStatus; approval: "Human Approved" | "Auto Approved" | null; approvedBy?: string;
  clientApproved: boolean; shared: boolean; sourceVersion?: number; technical: boolean; material: boolean;
  validated: boolean; warning: boolean; comments: CreativeComment[]; audit: CreativeAudit[];
}
export interface CreativeAsset {
  id: string; clientId: string; name: string; source: "Uploaded" | "AI Generated"; channel: string;
  tags: string[]; current: number; reviewer: string; clientRequired: boolean; versions: CreativeVersion[];
  pendingTask?: string; briefId?: string; fingerprint?: string;
  /** Creative Request that produced this asset. */
  requestId?: string;
  /** Google Drive provenance (imported via simulated Drive connection). */
  drive?: import("./creative-ops").DriveMeta;
}
export interface CreativeUsage { creativeId: string; version: number; campaignId: string; adId?: string; }
export interface CreativePolicy { enabled: boolean; version: number; enabledBy: string | null; }
export const POLICY_NAME = "Approved-source technical format adaptation";
export function policyChecks(asset: CreativeAsset, version: CreativeVersion, policy: CreativePolicy) {
  const source = asset.versions.find(v => v.number === version.sourceVersion);
  return [
    { name: "Explicit Admin authorization", passed: policy.enabled && policy.enabledBy !== null },
    { name: "Source version is already approved", passed: source?.review === "Approved" },
    { name: "Permitted transformation: aspect-ratio padding only", passed: version.technical },
    { name: "No substantive copy, claim or visual change", passed: !version.material },
    { name: "File and placement validation passed", passed: version.validated && version.width >= 500 && version.height >= 500 },
    { name: "No mandatory client approval outstanding", passed: !asset.clientRequired || version.clientApproved },
    { name: "No policy warning or unresolved required check", passed: !version.warning && !version.comments.some(c => !c.resolved && c.text.includes("[required]")) },
  ];
}
export function effectiveApproval(asset: CreativeAsset, v: CreativeVersion) { return v.review === "Approved" && (!asset.clientRequired || v.clientApproved); }
export function canReview(role: string, person: string, asset: CreativeAsset) { return role === "admin" || (role === "member" && asset.reviewer === person); }