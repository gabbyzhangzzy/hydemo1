import { describe, expect, it } from "vitest";
import * as f from "@/lib/demo/p0-flow";

function upTo(stepsDone: number) {
  const p = f.initialP0();
  while (f.completedSteps(p) < stepsDone && f.next(p)) { /* advance */ }
  return p;
}

describe("P0 card workflow", () => {
  it("runs all nine steps via Next Step", () => {
    const p = upTo(9);
    expect(f.completedSteps(p)).toBe(9);
    expect(p.perf.shown).toBe(true);
  });

  it("proposal change creates v2 and approval binds to it", () => {
    const p = upTo(1);
    f.requestProposalChanges(p, "Increase Meta allocation to 70%.");
    expect(p.proposal.revision).toBe(2);
    expect(p.proposal.metaPct).toBe(70);
    f.approveProposal(p);
    expect(p.proposal.approvedRevision).toBe(2);
    expect(p.proposal.history.map((h) => h.revision)).toEqual([1, 2]);
  });

  it("creative revision keeps history and resets approval", () => {
    const p = upTo(3);
    f.requestRevision(p, "FC-3", "Shorter hook");
    const c = p.creatives.find((x) => x.id === "FC-3")!;
    expect(c.versions.map((v) => v.status)).toEqual(["Changes Requested", "Pending Review"]);
    f.toggleSelect(p, "FC-5");
    f.approveSelected(p);
    expect(f.approvedCreatives(p).map((x) => x.id)).not.toContain("FC-5");
  });

  it("batch retry fixes failures without duplicating items", () => {
    const p = upTo(4);
    const before = p.exec.items.map((i) => i.id);
    expect(f.execCounts(p).failed).toBe(1);
    f.continueToChecks(p);
    expect(p.exec.continued).toBe(false); // blocked until retry
    f.retryExec(p);
    expect(p.exec.items.map((i) => i.id)).toEqual(before);
    expect(new Set(before).size).toBe(before.length);
  });

  it("A/B audience mode creates two ad sets per platform; creative mode one ad per creative", () => {
    const p = upTo(4);
    f.setMode(p, "ab_audience");
    expect(f.execCounts(p).adsets).toBe(4);
    f.setMode(p, "ab_creative");
    expect(f.execCounts(p).ads).toBe(2 * f.approvedCreatives(p).length);
  });

  it("blockers prevent launch until resolved and rechecked", () => {
    const p = upTo(5);
    expect(f.checksPass(p)).toBe(false);
    expect(f.canLaunch(p).ok).toBe(false);
    f.recheck(p); // nothing resolved yet
    expect(f.checksPass(p)).toBe(false);
    f.resolveIssue(p, "acct"); f.resolveIssue(p, "track");
    f.recheck(p);
    expect(f.checksPass(p)).toBe(true);
  });

  it("member cannot approve launch", () => {
    const p = upTo(6);
    p.role = "member";
    f.approveLaunch(p);
    expect(p.launch.status).toBe("none");
    p.role = "admin";
    f.approveLaunch(p);
    expect(p.launch.status).toBe("approved");
  });

  it("is not Live right after submission; failure retry does not duplicate", () => {
    const p = upTo(7);
    expect(f.LIFECYCLE[p.lifecycle.stage]).toBe("Submitted");
    expect(p.lifecycle.lastVerified).toBeNull();
    f.advanceLifecycle(p); f.advanceLifecycle(p);
    expect(p.lifecycle.failed).not.toBeNull();
    const n = p.lifecycle.submitted.length;
    f.retryLifecycle(p);
    while (p.lifecycle.stage < 5) f.advanceLifecycle(p);
    expect(p.lifecycle.submitted.length).toBe(n);
    expect(p.lifecycle.lastVerified).not.toBeNull();
  });

  it("changing config before launch invalidates passed checks", () => {
    const p = upTo(6);
    f.modifyExec(p, "Lower Meta budget");
    expect(p.checks).toHaveLength(0);
    expect(f.canLaunch(p).ok).toBe(false);
  });

  it("performance numbers are internally consistent", () => {
    const r = f.perfReport(60);
    const [m, t] = r.platforms;
    expect(m!.installs + t!.installs).toBe(r.installs);
    expect(r.spend).toBeCloseTo(2016.4, 1);
    expect(r.cpi).toBeCloseTo(r.spend / r.installs, 6);
  });
});
