import { beforeEach, describe, expect, it } from "vitest";
import { actions, getDemo } from "@/lib/demo/store";
import { deliveryBlockers, latestJobs, outputQA, requestStatus } from "@/lib/demo/creative-ops";

const req = (id: string) => getDemo().creativeRequests.find((r) => r.id === id)!;
function scenario() {
  actions.sendChannelMessage("freebeat", "@Creative Agent, prepare three video concepts for Freebeat's next campaign.");
  return getDemo().creativeRequests[0]!;
}
function finishJobs(id: string) { actions.advanceProduction(id); actions.advanceProduction(id); }

describe("Creative Requests — brief, production, QA and delivery", () => {
  beforeEach(() => { actions.reset(); });

  it("workspace request with missing objective is Needs Info and asks a focused question", () => {
    const r = scenario();
    expect(r.source).toBe("Agent Workspace");
    expect(r.brief.quantity).toBe(3);
    expect(requestStatus(getDemo(), r)).toBe("Needs Info");
    expect(r.intake.at(-1)?.text).toContain("user acquisition or retargeting");
    expect(getDemo().messages.at(-1)?.requestId).toBe(r.id);
    expect(getDemo().tasks.some((t) => t.id === r.taskId)).toBe(true);
  });

  it("cannot submit before the brief is confirmed; confirmed brief creates one job per output", () => {
    const r = scenario();
    actions.submitCreativeProduction(r.id);
    expect(req(r.id).submitted).toBe(false);
    actions.answerCreativeIntake(r.id, "Retargeting");
    expect(requestStatus(getDemo(), req(r.id))).toBe("Brief Review");
    actions.confirmCreativeBrief(r.id);
    actions.submitCreativeProduction(r.id);
    expect(getDemo().productionJobs.filter((j) => j.requestId === r.id)).toHaveLength(3);
    expect(requestStatus(getDemo(), req(r.id))).toBe("In Production");
  });

  it("failed job stays failed with unconfirmed cause and unknown cost; retry keeps the original", () => {
    const r = scenario();
    actions.answerCreativeIntake(r.id, "Retargeting"); actions.confirmCreativeBrief(r.id); actions.submitCreativeProduction(r.id);
    finishJobs(r.id);
    const s = getDemo();
    const failed = s.productionJobs.find((j) => j.requestId === r.id && j.status === "Failed")!;
    expect(failed.error?.message).toBe("Provider error — cause not yet confirmed.");
    expect(failed.error?.causeKnown).toBe(false);
    expect(failed.cost.state).toBe("Unknown / Pending Reconciliation");
    expect(failed.cost.amount).toBeNull();
    expect(s.productionJobs.filter((j) => j.requestId === r.id && j.status === "Succeeded").every((j) => j.cost.state === "Confirmed")).toBe(true);
    expect(requestStatus(s, req(r.id))).toBe("Delivery Blocked");
    actions.retryProductionJob(failed.id);
    const jobs = getDemo().productionJobs.filter((j) => j.requestId === r.id);
    expect(jobs).toHaveLength(4);
    expect(jobs.find((j) => j.id === failed.id)?.status).toBe("Failed");
    expect(latestJobs(getDemo(), req(r.id)).find((j) => j.slot === failed.slot)?.retryOf).toBe(failed.id);
  });

  it("output QA flags an over-length video and delivery stays blocked until checks and approvals pass", () => {
    const r = scenario();
    actions.answerCreativeIntake(r.id, "Retargeting"); actions.confirmCreativeBrief(r.id); actions.submitCreativeProduction(r.id);
    finishJobs(r.id);
    const s = getDemo();
    const slot3 = s.productionJobs.find((j) => j.requestId === r.id && j.slot === 3)!;
    const v = s.creativeAssets.find((a) => a.id === slot3.outputAssetId)!.versions[0]!;
    expect(outputQA(v, "9:16 vertical video").find((c) => c.name === "Duration")?.status).toBe("fail");
    actions.deliverCreativeRequest(r.id);
    expect(req(r.id).deliveredAt).toBeUndefined();
    expect(deliveryBlockers(getDemo(), req(r.id)).length).toBeGreaterThan(0);
  });

  it("a request is delivered only when every output passed QA and approval", () => {
    const r = scenario();
    actions.answerCreativeIntake(r.id, "Retargeting"); actions.confirmCreativeBrief(r.id); actions.submitCreativeProduction(r.id);
    finishJobs(r.id);
    const failed = getDemo().productionJobs.find((j) => j.requestId === r.id && j.status === "Failed")!;
    actions.retryProductionJob(failed.id); finishJobs(r.id);
    // fix slot 3 duration via a new version, then approve all outputs
    const s = getDemo();
    const ids = latestJobs(s, req(r.id)).map((j) => j.outputAssetId!);
    const a3 = s.creativeAssets.find((a) => a.id === latestJobs(s, req(r.id)).find((j) => j.slot === 3)!.outputAssetId)!;
    a3.versions[0]!.duration = 15; // simulated trimmed re-export (mutating test copy of state is enough for derivation)
    for (const aid of ids) actions.creativeReview(aid, 1, "Approved");
    expect(deliveryBlockers(getDemo(), req(r.id))).toEqual([]);
    actions.deliverCreativeRequest(r.id);
    expect(req(r.id).deliveredAt).toBeDefined();
  });
});

describe("Google Drive import and sync (simulated)", () => {
  beforeEach(() => { actions.reset(); actions.connectDrive(); });

  it("imports selected files into Uploaded with Drive provenance; failures do not block others", () => {
    const res = actions.importDriveFiles("DRV-FB", ["gd_fb_01", "gd_fb_02", "gd_fb_05", "gd_fb_07"], "freebeat");
    expect(res.imported).toHaveLength(3);
    expect(res.failed.map((f) => f.name)).toEqual(["fb_ugc_cut_v3.mov"]);
    const drive = getDemo().creativeAssets.filter((a) => a.drive);
    expect(drive.every((a) => a.source === "Uploaded" && a.clientId === "freebeat")).toBe(true);
  });

  it("refuses to import a folder into a client it is not mapped to", () => {
    const res = actions.importDriveFiles("DRV-FB", ["gd_fb_01"], "clientb");
    expect(res.error).toBeDefined();
    expect(getDemo().creativeAssets.some((a) => a.drive && a.clientId === "clientb")).toBe(false);
  });

  it("repeated sync skips unchanged files without duplicates", () => {
    actions.syncDriveFolder("DRV-FB");
    const n = getDemo().creativeAssets.filter((a) => a.drive).length;
    const res = actions.syncDriveFolder("DRV-FB");
    expect(res.imported).toHaveLength(0);
    expect(res.skipped.length).toBe(n);
    expect(getDemo().creativeAssets.filter((a) => a.drive).length).toBe(n);
  });

  it("source update never overwrites an approved version", () => {
    actions.syncDriveFolder("DRV-FB");
    const video = getDemo().creativeAssets.find((a) => a.drive?.fileId === "gd_fb_05")!;
    actions.creativeReview(video.id, 1, "Approved");
    actions.simulateDrive("DRV-FB", "update");
    const res = actions.syncDriveFolder("DRV-FB");
    expect(res.updated).toContain("fb_product_demo_15s.mp4");
    const after = getDemo().creativeAssets.find((a) => a.id === video.id)!;
    expect(after.current).toBe(1);
    expect(after.versions[0]?.review).toBe("Approved");
    expect(after.drive?.status).toBe("Source update available");
  });

  it("revoked access reports Authorization Required and imports nothing", () => {
    actions.syncDriveFolder("DRV-FB");
    actions.simulateDrive("DRV-FB", "revoke");
    const res = actions.syncDriveFolder("DRV-FB");
    expect(res.error).toContain("Authorization Required");
    expect(getDemo().drive.folders.find((f) => f.id === "DRV-FB")?.status).toBe("Authorization Required");
  });
});
