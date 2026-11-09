import { beforeEach, describe, expect, it } from "vitest";
import { actions, getDemo } from "@/lib/demo/store";

describe("Sign-in, acquisition and team invitations", () => {
  beforeEach(() => actions.reset());

  it("simulated sign-in creates a local demo identity without external accounts", () => {
    actions.signIn("google");
    expect(getDemo().identity?.provider).toBe("google");
    expect(getDemo().identity?.email).toBe("sarah@bluefocus.agency");
    actions.signIn("email", "  Jane.Doe@acme.com ");
    expect(getDemo().identity?.email).toBe("Jane.Doe@acme.com");
    expect(getDemo().identity?.name).toBe("Jane Doe");
    actions.signOut();
    expect(getDemo().identity).toBeNull();
  });

  it("homepage acquisition context is preserved for onboarding preselection", () => {
    actions.setAcquisition({ customerType: "agency", source: "homepage-agency" });
    expect(getDemo().acquisition?.customerType).toBe("agency");
    expect(getDemo().onboarding.customerType).toBeUndefined();
  });

  it("invitations are scoped to one client workspace and deduplicated", () => {
    actions.addInvites([
      { email: "david@bluefocus.agency", fn: "Creative Strategist", clientId: "freebeat" },
      { email: "david@bluefocus.agency", fn: "Creative Strategist", clientId: "freebeat" },
      { email: "not-an-email", fn: "Media Buyer", clientId: "freebeat" },
    ]);
    const invites = getDemo().invites;
    expect(invites).toHaveLength(1);
    expect(invites[0]?.clientId).toBe("freebeat");
    expect(invites[0]?.status).toBe("pending");
    // The same teammate can be invited to a different client workspace separately.
    actions.addInvites([{ email: "david@bluefocus.agency", fn: "Creative Strategist", clientId: "clientb" }]);
    expect(getDemo().invites).toHaveLength(2);
  });

  it("invites move from pending to accepted without sending email", () => {
    actions.addInvites([{ email: "alex@bluefocus.agency", fn: "Media Buyer", clientId: "freebeat" }]);
    const inv = getDemo().invites[0];
    if (!inv) throw new Error("Missing invite");
    actions.acceptInvite(inv.id);
    expect(getDemo().invites[0]?.status).toBe("accepted");
  });

  it("finishing onboarding routes direct customers to the direct workspace context", () => {
    actions.onboarding({ customerType: "own", step: 5 });
    actions.finishOnboarding();
    expect(getDemo().onboarded).toBe(true);
    expect(getDemo().biz).toBe("direct");
    expect(getDemo().clientId).toBe("direct");
  });
});
