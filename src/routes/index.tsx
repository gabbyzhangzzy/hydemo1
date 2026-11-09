import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ClipboardList,
  Eye,
  FolderKanban,
  Lock,
  Megaphone,
  MessageSquareText,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Hellyeah AI — Your AI growth team, working alongside yours",
      "Bring your people, campaigns, creatives and AI teammates into one workspace. Plan campaigns, coordinate execution, track results and keep work moving.",
    ),
  component: Homepage,
});

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="grid size-8 place-items-center rounded-lg bg-brand font-display font-black text-brand-foreground">H</div>
      <span className={cn("font-display text-lg font-bold", light ? "text-ai-panel-foreground" : "text-foreground")}>Hellyeah AI</span>
    </Link>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{kicker}</div>
      <h2 className="mt-3 font-display text-3xl font-bold text-ai-panel-foreground md:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-ai-panel-muted">{sub}</p>}
    </div>
  );
}

/** A chat bubble in the immersive workspace style. */
function ChatLine({ name, role, ai, children }: { name: string; role: string; ai?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold",
          ai ? "bg-brand text-brand-foreground" : "bg-ai-panel-elevated text-ai-panel-foreground ring-1 ring-ai-panel-border",
        )}
      >
        {name.split(" ").map((w) => w[0]).join("")}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ai-panel-foreground">{name}</span>
          <span className="text-[11px] text-ai-panel-muted">{role}</span>
          {ai && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">AI</span>}
        </div>
        <div className="mt-0.5 text-sm leading-relaxed text-ai-panel-foreground/90">{children}</div>
      </div>
    </div>
  );
}

/** Structured proposal card shown inside the chat preview. */
function ProposalPreview() {
  return (
    <div className="ml-11 max-w-md rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ai-panel-muted">Campaign proposal · Rev 2</span>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">Awaiting approval</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-ai-panel-foreground">Freebeat — US Awareness Campaign</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
        {[["$200/day", "Budget"], ["Meta", "Channel"], ["Reels-first", "Placements"]].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-ai-panel px-2 py-1.5">
            <div className="font-semibold text-ai-panel-foreground">{v}</div>
            <div className="text-ai-panel-muted">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-md bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">Approve</span>
        <span className="rounded-md bg-ai-panel px-2.5 py-1 text-[11px] font-semibold text-ai-panel-muted">Request changes</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Homepage() {
  const nav = useNavigate();
  const startAs = (customerType: "own" | "agency", source: string) => {
    actions.setAcquisition({ customerType, source });
    nav({ to: "/signin" });
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-ai-panel text-ai-panel-foreground">
      {/* A — Navigation */}
      <header className="sticky top-0 z-40 border-b border-ai-panel-border bg-ai-panel/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Logo light />
          <nav className="hidden items-center gap-6 text-sm text-ai-panel-muted md:flex">
            <button onClick={() => scrollTo("product")} className="transition hover:text-ai-panel-foreground">Product</button>
            <button onClick={() => scrollTo("agencies")} className="transition hover:text-ai-panel-foreground">For Agencies</button>
            <button onClick={() => scrollTo("businesses")} className="transition hover:text-ai-panel-foreground">For Businesses</button>
            <button onClick={() => scrollTo("how-it-works")} className="transition hover:text-ai-panel-foreground">How It Works</button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild className="text-ai-panel-muted hover:text-ai-panel-foreground">
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button variant="brand" asChild>
              <Link to="/signin">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* B — Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1fr_1.1fr] lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ai-panel-border bg-ai-panel-elevated px-3 py-1 text-xs font-medium text-ai-panel-muted">
            <Sparkles className="size-3.5 text-brand" /> Human + AI marketing workspace
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Your AI growth team. <span className="text-brand">Working alongside yours.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ai-panel-muted">
            Bring your people, campaigns, creatives and AI teammates into one workspace. Plan campaigns, coordinate execution, track
            results and keep work moving — without jumping between disconnected tools.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="brand" size="lg" asChild>
              <Link to="/signin">Get Started with Hellyeah <ArrowRight /></Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel-elevated"
              onClick={() => scrollTo("how-it-works")}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Hero visual — immersive workspace preview */}
        <div className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-5 shadow-2xl">
          <div className="mb-4 flex items-center gap-2 border-b border-ai-panel-border pb-3 text-xs text-ai-panel-muted">
            <MessageSquareText className="size-3.5" /> # freebeat-growth · Shared workspace
          </div>
          <div className="space-y-4">
            <ChatLine name="Sarah Linden" role="Account Manager">
              @Clayton, review Freebeat's campaign performance and recommend our next creative tests.
            </ChatLine>
            <ChatLine name="Clayton" role="AI Team Lead" ai>
              I'll ask @UA Agent to investigate performance and @Creative Agent to prepare creative directions.
            </ChatLine>
            <ChatLine name="UA Agent" role="AI Specialist" ai>
              Analysis ready. Reels placements are outpacing Feed on cost per install — I've highlighted the differences worth
              investigating.
            </ChatLine>
            <ProposalPreview />
          </div>
        </div>
      </section>

      {/* C — Who is Hellyeah for */}
      <section className="border-t border-ai-panel-border py-20" id="product">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="Who it's for" title="Built for the teams doing the growth work." />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div id="agencies" className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-8">
              <div className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand"><Users /></div>
              <h3 className="mt-4 font-display text-xl font-bold">Marketing Agencies</h3>
              <p className="mt-1 text-lg font-semibold text-brand">More clients. Less busywork.</p>
              <p className="mt-3 text-sm leading-relaxed text-ai-panel-muted">
                Give every client a dedicated workspace where account managers, media buyers, creative strategists and AI teammates work
                together.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ai-panel-foreground/90">
                {["Manage multiple clients", "Coordinate AI and human work", "Review and approve campaigns and creatives", "Reduce repetitive reporting and task handoffs"].map((b) => (
                  <li key={b} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {b}</li>
                ))}
              </ul>
              <Button variant="brand" className="mt-6" onClick={() => startAs("agency", "homepage-agency")}>
                Explore Agency Workspace <ArrowRight />
              </Button>
            </div>
            <div id="businesses" className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-8">
              <div className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand"><Rocket /></div>
              <h3 className="mt-4 font-display text-xl font-bold">B2B Growth Teams</h3>
              <p className="mt-1 text-lg font-semibold text-brand">Get marketing moving without building an entire team.</p>
              <p className="mt-3 text-sm leading-relaxed text-ai-panel-muted">
                Work with an AI Account Manager that helps you turn business goals into campaigns, creative briefs and next steps.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ai-panel-foreground/90">
                {["AI-guided campaign planning", "Creative research and preparation", "Campaign performance monitoring", "Human oversight and approval"].map((b) => (
                  <li key={b} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {b}</li>
                ))}
              </ul>
              <Button variant="brand" className="mt-6" onClick={() => startAs("own", "homepage-business")}>
                Explore AI Growth Teammate <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* D — Problems & Solutions */}
      <section className="border-t border-ai-panel-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="Why Hellyeah" title="Your marketing workflow shouldn't live in ten different places." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Megaphone, t: "Campaign operations", p: "Campaign preparation, execution and reporting involve repetitive work.", s: "AI teammates help organize and prepare actual marketing tasks." },
              { icon: Users, t: "Team coordination", p: "Agency work is fragmented across people, tools and conversations.", s: "Human staff and AI Agents collaborate in one Client Workspace." },
              { icon: Palette, t: "Creative workflow", p: "Creative files, versions, feedback and approvals are difficult to manage.", s: "Bring uploaded and AI-generated assets, version history, comments and reviews together." },
              { icon: BarChart3, t: "Performance analysis", p: "Dashboards contain lots of data, but it is not always clear what to do next.", s: "Turn performance insights into specific UA, Creative and follow-up tasks." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-6">
                <c.icon className="size-5 text-brand" />
                <h3 className="mt-3 font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm text-ai-panel-muted">{c.p}</p>
                <p className="mt-3 border-t border-ai-panel-border pt-3 text-sm text-ai-panel-foreground/90">{c.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E — How it works */}
      <section className="border-t border-ai-panel-border py-20" id="how-it-works">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="How it works" title="From a marketing goal to work that actually gets done." />
          <ol className="mt-12 grid gap-5 md:grid-cols-5">
            {[
              { icon: Target, t: "Tell us your goal", d: "Select a marketing objective or describe it to AI." },
              { icon: ClipboardList, t: "Set up your business context", d: "Confirm your company, client, brand and relevant campaign information." },
              { icon: Bot, t: "Work with your AI teammates", d: "Clayton or your AI AM coordinates specialist capabilities." },
              { icon: ShieldCheck, t: "Review and launch", d: "Use structured proposals, readiness checks and approvals." },
              { icon: BarChart3, t: "Monitor and improve", d: "Understand campaign results and turn findings into follow-up work." },
            ].map((st, i) => (
              <li key={st.t} className="relative rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-5">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">{i + 1}</span>
                  <st.icon className="size-4 text-ai-panel-muted" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{st.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ai-panel-muted">{st.d}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-ai-panel-muted">
            Launching real campaigns always requires the necessary authorization, funding and human approval — Hellyeah keeps those
            checks explicit.
          </p>
        </div>
      </section>

      {/* F — Capabilities */}
      <section className="border-t border-ai-panel-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="Capabilities" title="One workspace for the work behind growth." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquareText, t: "AI Workspace", d: "Human + AI collaboration, with Clayton and specialist Agents in one conversation." },
              { icon: Megaphone, t: "Campaign Operations", d: "Campaign planning, management, approvals and launch tracking." },
              { icon: Palette, t: "Creative Management", d: "Uploads, AI generation, versions, comments and creative reviews." },
              { icon: BarChart3, t: "Analytics & Insights", d: "Performance across channels, countries, devices, campaigns and ads." },
              { icon: Workflow, t: "Tasks & Workflows", d: "Track running work, completed tasks and items awaiting input." },
              { icon: FolderKanban, t: "Brand, Accounts & Permissions", d: "Business context, advertising accounts and operational readiness." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-6 transition hover:border-brand/40">
                <c.icon className="size-5 text-brand" />
                <h3 className="mt-3 font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ai-panel-muted">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G — Human + AI collaboration */}
      <section className="border-t border-ai-panel-border py-20">
        <div className="mx-auto max-w-4xl px-6">
          <SectionTitle
            kicker="Human + AI"
            title="AI teammates that work with your team, not in another tab."
            sub="A shared client workspace where people and Agents coordinate real marketing work."
          />
          <div className="mt-12 rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-2 border-b border-ai-panel-border pb-3 text-xs text-ai-panel-muted">
              <MessageSquareText className="size-3.5" /> # freebeat-growth · BlueFocus × Freebeat
            </div>
            <div className="space-y-5">
              <ChatLine name="Sarah Linden" role="Account Manager">
                @Clayton, review Freebeat's campaign performance and recommend our next creative tests.
              </ChatLine>
              <ChatLine name="Clayton" role="AI Team Lead" ai>
                I'll ask @UA Agent to investigate performance and @Creative Agent to prepare creative directions.
              </ChatLine>
              <ChatLine name="UA Agent" role="AI Specialist" ai>
                Analysis ready. I've highlighted the placement differences worth investigating.
              </ChatLine>
              <ChatLine name="Creative Agent" role="AI Specialist" ai>
                Three creative directions are ready for David's review.
              </ChatLine>
              <ChatLine name="David Kim" role="Creative Strategist">
                Let's develop the second direction into a UGC variation.
              </ChatLine>
            </div>
          </div>
        </div>
      </section>

      {/* H — Trust & control */}
      <section className="border-t border-ai-panel-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="Trust & control" title="Your team stays in control." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Eye, t: "Review important work", d: "Human teams can inspect campaign proposals, creative changes and approvals before anything goes live." },
              { icon: Lock, t: "Clear access boundaries", d: "Client workspaces and account permissions have defined scopes — teammates only see what they should." },
              { icon: ClipboardList, t: "Track what happens", d: "Tasks, blockers, approvals and actual campaign states are visible, not hidden behind automation." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-6">
                <c.icon className="size-5 text-brand" />
                <h3 className="mt-3 font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ai-panel-muted">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* I — Final CTA + footer */}
      <section className="border-t border-ai-panel-border py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to give your team an AI growth teammate?</h2>
          <p className="mt-4 text-ai-panel-muted">
            Start with your marketing goal. We'll help you set up your workspace and guide you through the next steps.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="brand" size="lg" asChild>
              <Link to="/signin">Get Started with Hellyeah <ArrowRight /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel-elevated">
              <Link to="/signin">Already have an account? Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
      <footer className="border-t border-ai-panel-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-ai-panel-muted md:flex-row">
          <Logo light />
          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo("product")} className="transition hover:text-ai-panel-foreground">Product</button>
            <button onClick={() => scrollTo("how-it-works")} className="transition hover:text-ai-panel-foreground">How It Works</button>
            <Link to="/signin" className="transition hover:text-ai-panel-foreground">Sign In</Link>
          </div>
          <div className="text-xs">Hellyeah AI — interactive product prototype.</div>
        </div>
      </footer>
    </div>
  );
}
