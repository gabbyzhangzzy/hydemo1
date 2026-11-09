import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, hydrateDemo, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/signin")({
  head: () => pageHead("Sign In", "Sign in to start building your AI growth workspace."),
  component: SignIn,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1L1.3 17.2C3.3 21.2 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.3 6.8C.5 8.4 0 10.1 0 12s.5 3.6 1.3 5.2l3.9-2.9z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.8 1.3 6.8l3.9 2.9c.9-2.9 3.6-5 6.8-5z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#F25022" d="M0 0h11.4v11.4H0z" />
      <path fill="#7FBA00" d="M12.6 0H24v11.4H12.6z" />
      <path fill="#00A4EF" d="M0 12.6h11.4V24H0z" />
      <path fill="#FFB900" d="M12.6 12.6H24V24H12.6z" />
    </svg>
  );
}

function SignIn() {
  const s = useDemo();
  const nav = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => { hydrateDemo(); }, []);

  const continueTo = (provider: "google" | "microsoft" | "email", em?: string) => {
    setBusy(provider);
    // Simulated loading — no real OAuth, no passwords, no OTPs.
    setTimeout(() => {
      actions.signIn(provider, em);
      if (s.onboarded) {
        nav({ to: s.biz === "direct" ? "/workspace" : "/overview" });
      } else {
        // First-time, incomplete and BD-invited users all land on onboarding,
        // which resumes at the right step (BD path shows the preconfigured review).
        nav({ to: "/onboarding" });
      }
    }, 900);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ai-panel px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ai-panel-muted transition hover:text-ai-panel-foreground">
          <ArrowLeft className="size-4" /> Back to Homepage
        </Link>
        <div className="rounded-2xl border border-ai-panel-border bg-ai-panel-elevated/60 p-8">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-brand font-display font-black text-brand-foreground">H</div>
            <span className="font-display text-lg font-bold text-ai-panel-foreground">Hellyeah AI</span>
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ai-panel-foreground">Welcome to Hellyeah</h1>
          <p className="mt-1.5 text-sm text-ai-panel-muted">Sign in to start building your AI growth workspace.</p>

          {s.acquisition?.customerType && (
            <div className="mt-4 rounded-lg border border-ai-panel-border bg-ai-panel px-3 py-2 text-xs text-ai-panel-muted">
              Continuing as: <span className="font-semibold text-ai-panel-foreground">{s.acquisition.customerType === "agency" ? "Marketing Agency" : "Business / Direct Customer"}</span>
              — you can change this during setup.
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel"
              disabled={busy !== null}
              onClick={() => continueTo("google")}
            >
              {busy === "google" ? <Loader2 className="animate-spin" /> : <GoogleIcon />} Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel"
              disabled={busy !== null}
              onClick={() => continueTo("microsoft")}
            >
              {busy === "microsoft" ? <Loader2 className="animate-spin" /> : <MicrosoftIcon />} Continue with Microsoft
            </Button>
            {emailOpen ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim().includes("@")) continueTo("email", email);
                }}
              >
                <Input
                  autoFocus
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-ai-panel-border bg-ai-panel text-ai-panel-foreground placeholder:text-ai-panel-muted"
                />
                <Button type="submit" variant="brand" disabled={busy !== null}>
                  {busy === "email" ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel"
                disabled={busy !== null}
                onClick={() => setEmailOpen(true)}
              >
                <Mail /> Continue with Email
              </Button>
            )}
          </div>

          <p className="mt-6 rounded-lg bg-ai-panel px-3 py-2 text-center text-[11px] text-ai-panel-muted">
            Demo authentication — no external account connection.
          </p>
        </div>
      </div>
    </div>
  );
}
