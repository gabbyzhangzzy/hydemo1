import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BarChart3, Bot, Briefcase, Check, Headset, Loader2, MailPlus, Rocket, Search, Send, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandCard } from "@/components/demo/brand-card";
import { Pill } from "@/components/demo/bits";
import { actions, FREEBEAT_BRAND, hydrateDemo, useDemo, type Brand } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => pageHead("Onboarding", "Tell Hellyeah what you want to achieve and get your AI growth team set up in minutes."),
  component: Onboarding,
});

const GOALS = [
  { id: "launch", label: "Launch a campaign", icon: Rocket },
  { id: "analyze", label: "Analyze existing campaigns", icon: BarChart3 },
  { id: "creative", label: "Research or create ads", icon: Search },
  { id: "explore", label: "Explore my AI team", icon: Bot },
  { id: "clients", label: "Manage marketing for clients", icon: Users },
];

const INVITE_FUNCTIONS = ["Account Manager", "Media Buyer", "Creative Strategist"];

function Onboarding() {
  const s = useDemo();
  useEffect(() => { hydrateDemo(); }, []);
  // Preselect the customer type indicated by the homepage CTA (still changeable below).
  useEffect(() => {
    const acq = s.acquisition;
    if (acq?.customerType && !s.onboarding.customerType && s.onboarding.step === 0) {
      actions.onboarding({ customerType: acq.customerType === "agency" ? "agency" : "own" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-brand font-display font-black text-brand-foreground">H</div>
          <span className="font-display font-semibold">Hellyeah</span>
        </Link>
        <Pill tone="brand" className="text-[9px] uppercase">Product simulation</Pill>
        {s.identity && <span className="hidden text-xs text-muted-foreground sm:inline">Signed in as {s.identity.email} (demo)</span>}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-xs font-medium">
          {(["self", "bd"] as const).map((p) => (
            <button key={p} onClick={() => actions.setAccessPath(p)} className={cn("rounded-md px-3 py-1.5", s.accessPath === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {p === "self" ? "Self-serve" : "BD-assisted invite"}
            </button>
          ))}
        </div>
      </header>
      {s.onboarded ? <Done /> : s.accessPath === "bd" ? <BdReview /> : <SelfServe />}
    </div>
  );
}

function Done() {
  const s = useDemo();
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-success/15 text-success"><Check /></div>
      <h1 className="text-3xl font-semibold">You're set up.</h1>
      <p className="mt-2 text-muted-foreground">{s.biz === "direct" ? "Your AI AM is ready for Northwind Coffee." : "BlueFocus workspace with Freebeat is ready."}</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="brand" asChild><Link to={s.biz === "direct" ? "/workspace" : "/overview"}>Open workspace <ArrowRight /></Link></Button>
        <Button variant="outline" onClick={() => actions.reset()}>Restart demo</Button>
      </div>
    </div>
  );
}

function Bubble({ who, children }: { who: "ai" | "user"; children: React.ReactNode }) {
  return who === "ai" ? (
    <div className="flex gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">C</div>
      <div className="max-w-xl text-[15px] leading-relaxed">{children}</div>
    </div>
  ) : (
    <div className="flex justify-end"><div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">{children}</div></div>
  );
}

/** Optional team invitation step (Agency flows). Simulated — no real emails are sent. */
function TeamInvite({ onDone }: { onDone: () => void }) {
  const s = useDemo();
  const [email, setEmail] = useState("");
  const [fn, setFn] = useState(INVITE_FUNCTIONS[0]!);
  const [clientId, setClientId] = useState("freebeat");
  const [draft, setDraft] = useState<{ email: string; fn: string; clientId: string }[]>([]);
  const agencyClients = s.clients.filter((c) => c.biz === "bluefocus");
  const clientName = (cid: string) => s.clients.find((c) => c.id === cid)?.name ?? cid;

  const add = () => {
    const e = email.trim();
    if (!e.includes("@")) return;
    if (draft.some((d) => d.email === e && d.clientId === clientId)) return;
    setDraft([...draft, { email: e, fn, clientId }]);
    setEmail("");
  };

  return (
    <div className="card-surface space-y-4 p-5">
      <div>
        <div className="flex items-center gap-2 font-semibold"><MailPlus className="size-4 text-brand" /> Bring your team into the workspace.</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite your account managers, media buyers and creative teammates to work with Clayton. Invitations are simulated — no real
          emails are sent.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_170px_170px_auto]">
        <div>
          <Label>Teammate email</Label>
          <Input placeholder="teammate@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        </div>
        <div>
          <Label>Work function</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={fn} onChange={(e) => setFn(e.target.value)}>
            {INVITE_FUNCTIONS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <Label>Client workspace</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {agencyClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={add} disabled={!email.includes("@")}>Add</Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Work functions are labels only — permissions stay Admin / Member. Each invite is scoped to one client workspace: a teammate
        invited to {clientName("freebeat")} does not automatically get access to {clientName("clientb")}.
      </p>
      {(draft.length > 0 || s.invites.length > 0) && (
        <ul className="space-y-2 text-sm">
          {s.invites.map((inv) => (
            <li key={inv.id} className="flex items-center gap-2">
              <span className="font-medium">{inv.email}</span>
              <span className="text-muted-foreground">· {inv.fn} · {clientName(inv.clientId)}</span>
              <Pill tone={inv.status === "accepted" ? "success" : "warning"}>{inv.status === "accepted" ? "Accepted" : "Pending"}</Pill>
              {inv.status === "pending" && (
                <button className="text-xs text-info hover:underline" onClick={() => actions.acceptInvite(inv.id)}>simulate accept</button>
              )}
            </li>
          ))}
          {draft.map((d) => (
            <li key={`${d.email}-${d.clientId}`} className="flex items-center gap-2">
              <span className="font-medium">{d.email}</span>
              <span className="text-muted-foreground">· {d.fn} · {clientName(d.clientId)}</span>
              <Pill>Draft</Pill>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setDraft(draft.filter((x) => x !== d))}><X className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="brand"
          disabled={draft.length === 0}
          onClick={() => {
            actions.addInvites(draft);
            setDraft([]);
            onDone();
          }}
        >
          Send invitations (simulated) <Send />
        </Button>
        <Button variant="ghost" onClick={onDone}>Skip for now</Button>
      </div>
    </div>
  );
}

function SelfServe() {
  const s = useDemo();
  const o = s.onboarding;
  const nav = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [invitesDone, setInvitesDone] = useState(false);
  const goal = GOALS.find((g) => g.id === o.goal);
  const needsCampaign = o.goal === "launch" || o.goal === "clients" || o.goal === "analyze";
  const isAgency = o.customerType === "agency";
  const brand: Brand | undefined = s.brands[isAgency ? "freebeat" : "direct"];
  const checklist = [
    { l: "Goal", done: !!o.goal },
    { l: "Business type", done: !!o.customerType },
    { l: isAgency ? "Agency & first client" : "Company", done: o.step >= 3 },
    { l: "Brand Profile", done: brand?.status === "confirmed" && o.step >= 4 },
    ...(needsCampaign ? [{ l: "Objective & channel", done: o.step >= 5 }, { l: "Account access & funding (later)", done: false, later: true }] : [{ l: "No wallet needed for this goal", done: true }]),
    ...(isAgency ? [{ l: "Team invitations (optional)", done: invitesDone || s.invites.length > 0 }] : []),
  ];
  const pickGoal = (id: string) => actions.onboarding({ goal: id, customerType: id === "clients" ? "agency" : o.customerType, step: id === "clients" ? 2 : 1 });
  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const host = o.url.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";
      const b: Brand = isAgency
        ? { ...FREEBEAT_BRAND, name: o.clientName || "Freebeat", url: host, source: "ai", status: "draft" }
        : { name: o.company || "Northwind Coffee", description: "Specialty coffee roaster with neighborhood cafés (AI draft).", industry: "Food & beverage", audience: "Local commuters & remote workers", market: "Seattle, WA", url: host, assets: ["Logo", "Café photos (4)"], status: "draft", source: "ai" };
      actions.setBrand(isAgency ? "freebeat" : "direct", b);
      setAnalyzing(false);
      actions.onboarding({ step: 3 });
    }, 1800);
  };
  const finish = () => {
    actions.finishOnboarding();
    nav({ to: isAgency ? "/workspace" : "/workspace" });
  };
  const readyToFinish = o.step >= 5 && (!isAgency || invitesDone || s.invites.length > 0);
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <Bubble who="ai">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">What would you like to achieve with Hellyeah?</h1>
          <p className="mt-1 text-sm text-muted-foreground">I'm Clayton, your AI team lead. Pick one — we'll only set up what you need.</p>
        </Bubble>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => pickGoal(g.id)} className={cn("card-surface flex items-center gap-3 p-4 text-left text-sm font-semibold transition hover:-translate-y-0.5", o.goal === g.id && "ring-2 ring-brand")}>
              <g.icon className="size-5 text-brand" /> {g.label}
            </button>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!o.freeText.trim()) return; const t = o.freeText.toLowerCase(); pickGoal(t.includes("client") || t.includes("agency") ? "clients" : t.includes("creative") || t.includes("ad idea") ? "creative" : t.includes("analy") ? "analyze" : "launch"); }}>
          <Input placeholder="Or describe it in your own words…" value={o.freeText} onChange={(e) => actions.onboarding({ freeText: e.target.value })} />
          <Button type="submit" variant="outline"><Send /></Button>
        </form>

        {o.goal && <Bubble who="user">{goal?.label}</Bubble>}

        {o.step >= 1 && o.goal !== "clients" && (
          <>
            <Bubble who="ai">Who are you managing marketing for?</Bubble>
            <div className="flex gap-2">
              {(["own", "agency"] as const).map((t) => (
                <Button key={t} variant={o.customerType === t ? "default" : "outline"} onClick={() => actions.onboarding({ customerType: t, step: Math.max(o.step, 2) })}>
                  {t === "own" ? <Briefcase /> : <Users />} {t === "own" ? "My own business" : "My clients (Agency)"}
                </Button>
              ))}
            </div>
          </>
        )}

        {o.step >= 2 && (
          <>
            <Bubble who="ai">{isAgency ? "Great — which agency are you with, and who's your first client?" : "What's your company called and where can I find it online?"}</Bubble>
            <div className="card-surface grid gap-3 p-4 sm:grid-cols-3">
              <div><Label>{isAgency ? "Agency" : "Company"}</Label><Input value={isAgency ? o.company : o.company === "BlueFocus" ? "Northwind Coffee" : o.company} onChange={(e) => actions.onboarding({ company: e.target.value })} /></div>
              {isAgency && <div><Label>First client</Label><Input value={o.clientName} onChange={(e) => actions.onboarding({ clientName: e.target.value })} /></div>}
              <div><Label>Website / App URL</Label><Input value={isAgency ? o.url : o.url === "freebeat.ai" ? "northwind.example" : o.url} onChange={(e) => actions.onboarding({ url: e.target.value })} /></div>
              <div className="sm:col-span-3">
                <Button
                  disabled={analyzing}
                  onClick={() => {
                    if (!isAgency) actions.onboarding({ company: o.company === "BlueFocus" ? "Northwind Coffee" : o.company, url: o.url === "freebeat.ai" ? "northwind.example" : o.url });
                    analyze();
                  }}
                >
                  {analyzing ? <><Loader2 className="animate-spin" /> Analyzing website (simulated)…</> : <><Sparkles /> Analyze website</>}
                </Button>
              </div>
            </div>
          </>
        )}

        {o.step >= 3 && brand && (
          <>
            <Bubble who="ai">Here's what I found. Everything is a <b>draft</b> until you confirm it.</Bubble>
            <BrandCard
              brand={brand}
              onSave={(b) => actions.setBrand(isAgency ? "freebeat" : "direct", b)}
              onConfirm={(b) => { actions.confirmBrand(isAgency ? "freebeat" : "direct", b); actions.onboarding({ step: needsCampaign ? 4 : 5 }); }}
            />
            {brand.status === "confirmed" && o.step < 4 && <Button onClick={() => actions.onboarding({ step: needsCampaign ? 4 : 5 })}>Continue</Button>}
          </>
        )}

        {o.step >= 4 && needsCampaign && (
          <>
            <Bubble who="ai">Last thing for now: what's the marketing objective and channel? Account access and funding come later — only when you launch.</Bubble>
            <div className="card-surface grid gap-3 p-4 sm:grid-cols-2">
              <div><Label>Objective</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">{["Awareness", "Installs", "Sales"].map((x) => <Button key={x} size="sm" variant={o.objective === x ? "default" : "outline"} onClick={() => actions.onboarding({ objective: x })}>{x}</Button>)}</div>
              </div>
              <div><Label>Channel</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">{["Meta Ads", "Google Ads", "TikTok Ads"].map((x) => <Button key={x} size="sm" variant={o.channel === x ? "default" : "outline"} onClick={() => actions.onboarding({ channel: x })}>{x}</Button>)}</div>
              </div>
              <div className="sm:col-span-2"><Button onClick={() => actions.onboarding({ step: 5 })}>Save <Check /></Button></div>
            </div>
          </>
        )}

        {o.step >= 5 && isAgency && !readyToFinish && (
          <>
            <Bubble who="ai">Your client workspace is almost ready. Want to bring your team in now, or later?</Bubble>
            <TeamInvite onDone={() => setInvitesDone(true)} />
          </>
        )}

        {readyToFinish && (
          <>
            <Bubble who="ai">{needsCampaign ? "Your AI team is ready. When you're ready to launch I'll walk you through account access, funding and approval." : "You're ready — no wallet or ad account needed for creative research."}</Bubble>
            <Button variant="brand" size="lg" onClick={finish}>Enter workspace <ArrowRight /></Button>
          </>
        )}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card-surface p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Setup progress</div>
          <ul className="space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.l} className="flex items-center gap-2">
                <span className={cn("grid size-4 place-items-center rounded-full text-[9px]", c.done ? "bg-success text-primary-foreground" : "border border-border")}>{c.done && "✓"}</span>
                <span className={cn(!c.done && "text-muted-foreground")}>{c.l}</span>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => toast("Human help requested (simulated)", { description: "A Hellyeah specialist would join this chat. You can keep going meanwhile." })} className="card-surface flex w-full items-center gap-2 p-4 text-left text-sm">
          <Headset className="size-4 text-brand" /> Prefer a human? <span className="font-semibold">Get help</span>
        </button>
      </aside>
    </div>
  );
}

function BdReview() {
  const s = useDemo();
  const nav = useNavigate();
  const [invitesOpen, setInvitesOpen] = useState(false);
  const brand = s.brands["freebeat"];
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Pill tone="info">Invitation from Hellyeah BD · Andy & team</Pill>
      <h1 className="mt-3 text-3xl font-semibold">Welcome, BlueFocus. We've set things up for Freebeat.</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Review and correct what our team prefilled — no need to repeat onboarding.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {brand && (
          <BrandCard
            brand={brand}
            onSave={(b) => actions.setBrand("freebeat", b)}
            onConfirm={(b) => actions.confirmBrand("freebeat", b)}
          />
        )}
        <div className="space-y-4">
          <div className="card-surface p-4 text-sm">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Preconfigured scenario</div>
            {[["Agency", "BlueFocus"], ["End Client", "Freebeat"], ["Channel", "Meta Ads"], ["Objective", "Awareness"], ["Daily budget", "$200"], ["Total cap", "$2,000"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="card-surface p-4 text-sm">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Enabled capabilities</div>
            <ul className="space-y-1.5">
              <li className="flex justify-between">AM coordination <Pill tone="success">Included</Pill></li>
              <li className="flex justify-between">UA Agent <Pill tone="success">Enabled</Pill></li>
              <li className="flex justify-between">Creative <Pill tone="info">Approved assets</Pill></li>
              <li className="flex justify-between">Bulk generation <Pill>Not enabled</Pill></li>
            </ul>
          </div>
          <div className="card-surface p-4 text-sm">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Accounts</div>
            <div className="flex justify-between py-1"><span>Meta ad account</span><Pill tone="success">Assigned</Pill></div>
            <div className="flex justify-between py-1"><span>Meta Page access</span><Pill tone="danger">Authorization pending</Pill></div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        {invitesOpen ? (
          <TeamInvite onDone={() => setInvitesOpen(false)} />
        ) : (
          <button onClick={() => setInvitesOpen(true)} className="card-surface flex w-full items-center gap-2 p-4 text-left text-sm">
            <MailPlus className="size-4 text-brand" /> Invite your team to the Freebeat workspace <span className="text-muted-foreground">(optional)</span>
          </button>
        )}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="brand" size="lg" disabled={brand?.status !== "confirmed"} onClick={() => { actions.finishOnboarding(); nav({ to: "/overview" }); }}>
          Confirm setup & open workspace <ArrowRight />
        </Button>
        {brand?.status !== "confirmed" && <span className="text-sm text-muted-foreground">Confirm the Brand Profile first.</span>}
      </div>
    </div>
  );
}
