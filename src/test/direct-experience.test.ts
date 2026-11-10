import { beforeEach, describe, expect, it } from "vitest";
import { actions, actorName, allProposals, getDemo, personFor } from "@/lib/demo/store";

describe("Direct Customer experience — one visible AI AM", () => {
  beforeEach(() => {
    actions.reset();
    actions.setContext("direct");
  });

  it("direct identity is never an agency persona", () => {
    const s = getDemo();
    expect(s.biz).toBe("direct");
    expect(personFor(s)).toBeNull();
    expect(actorName(s)).not.toBe("Maya Chen");
    expect(actorName(s)).not.toContain("BlueFocus");
  });

  it("ordinary direct messages get an AI AM task and only AI AM replies", () => {
    actions.sendChannelMessage("direct", "How did my campaigns perform over the last seven days?");
    const s = getDemo();
    const msgs = s.messages.filter((m) => m.clientId === "direct");
    expect(msgs.some((m) => m.from === "user")).toBe(true);
    expect(msgs.filter((m) => m.from !== "user" && m.from !== "system").every((m) => m.from === "aiam")).toBe(true);
    const t = s.tasks.find((x) => x.clientId === "direct" && x.status === "running");
    expect(t?.agent).toBe("AI AM");
  });

  it("pasted specialist @mentions are intercepted and routed through AI AM", () => {
    actions.sendChannelMessage("direct", "@UA Agent, analyze my campaign");
    const s = getDemo();
    const msgs = s.messages.filter((m) => m.clientId === "direct");
    // No specialist agent ever speaks in the direct conversation.
    expect(msgs.some((m) => m.from === "ua" || m.from === "creative" || m.from === "clayton")).toBe(false);
    expect(msgs.some((m) => m.from === "aiam" && /coordinate the specialist work/i.test(m.text))).toBe(true);
    const t = s.tasks.find((x) => x.clientId === "direct" && x.status === "running");
    expect(t?.agent).toBe("AI AM");
    expect(t?.title).not.toContain("@UA Agent");
  });

  it("AI AM drafts a campaign proposal for a direct planning request", () => {
    actions.sendChannelMessage("direct", "Help me plan a new campaign for my business.");
    const s = getDemo();
    const p = allProposals(s).find((c) => c.clientId === "direct");
    expect(p).toBeDefined();
    expect(p!.status).toBe("draft");
    expect(p!.revisions[0]?.by).toBe("AI AM");
    expect(s.messages.filter((m) => m.clientId === "direct").some((m) => m.from === "aiam" && m.card === "proposal")).toBe(true);
  });

  it("AI actions from other modules route through AI AM and strip specialist prefixes", () => {
    actions.startGenericTask("direct", "Campaign review: Northwind", "UA Agent", "@UA Agent — campaign review request from the Campaigns hub:\nCampaign “X”");
    const s = getDemo();
    const t = s.tasks.find((x) => x.clientId === "direct" && x.title.includes("Campaign review"));
    expect(t?.agent).toBe("AI AM");
    const userMsg = s.messages.filter((m) => m.clientId === "direct" && m.from === "user").at(-1);
    expect(userMsg?.text.startsWith("@UA Agent")).toBe(false);
  });

  it("Plan with AI AM prefills a natural-language prompt without @mentions", () => {
    actions.planWithClayton("direct");
    const s = getDemo();
    expect(s.pendingPrompt).toBeTruthy();
    expect(s.pendingPrompt).not.toContain("@Clayton");
    expect(s.pendingPrompt).not.toContain("@UA");
  });
});

describe("Agency regression — multi-agent collaboration preserved", () => {
  beforeEach(() => {
    actions.reset();
    actions.setContext("freebeat");
  });

  it("agency users can still @mention specialist agents and get specialist replies", () => {
    actions.sendChannelMessage("freebeat", "@UA Agent give me a quick performance review for this week");
    const s = getDemo();
    const msgs = s.messages.filter((m) => m.clientId === "freebeat");
    expect(msgs.some((m) => m.from === "ua")).toBe(true);
    const t = s.tasks.find((x) => x.clientId === "freebeat" && x.status === "running");
    expect(t?.agent).toBe("UA Agent");
  });

  it("agency identity still resolves to BlueFocus people", () => {
    const s = getDemo();
    expect(personFor(s)?.full).toBe("Maya Chen");
    expect(actorName(s)).toBe("Maya Chen");
  });

  it("direct and agency conversations stay isolated", () => {
    actions.sendChannelMessage("freebeat", "@UA Agent check pacing");
    actions.setContext("direct");
    actions.sendChannelMessage("direct", "What's happening with my current campaigns?");
    const s = getDemo();
    expect(s.messages.filter((m) => m.clientId === "direct").every((m) => m.from === "user" || m.from === "aiam" || m.from === "system")).toBe(true);
    expect(s.messages.filter((m) => m.clientId === "freebeat").some((m) => m.from === "ua")).toBe(true);
  });
});
