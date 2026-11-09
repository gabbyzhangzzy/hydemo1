import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Demo, PageHeader, Pill, Section, money } from "@/components/demo/bits";
import { ReadinessPanel } from "@/components/demo/campaign";
import { actions, can, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/wallet")({
  head: () => pageHead("Accounts & Wallet", "Simulated wallet funding, ad accounts and launch readiness."),
  component: WalletPage,
});

function WalletPage() {
  const s = useDemo();
  const [amt, setAmt] = useState("2000");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Business" title="Accounts & Wallet" sub="Advertising spend is tracked separately from agent entitlements." right={<Demo>No real payments</Demo>} />
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="BlueFocus Wallet">
          <div className="font-display text-4xl font-semibold">{money(s.wallet.balance)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Demo balance</div>
          {can.fund(s.role) ? (
            <div className="mt-4 flex gap-2">
              <Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} className="max-w-40" />
              <Button variant="brand" onClick={() => actions.addFunds(Number(amt))} disabled={!(Number(amt) > 0)}><Plus /> Add funds (simulated)</Button>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><Lock className="mt-0.5 size-4" /> Wallet funding requires a BlueFocus Admin. Ask Maya Chen to fund.</div>
          )}
          <div className="mt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</div>
          <ul className="mt-2 divide-y divide-border text-sm">
            {s.wallet.activity.length === 0 && <li className="py-2 text-muted-foreground">No activity yet.</li>}
            {s.wallet.activity.map((a) => <li key={a.id} className="flex justify-between py-2"><span>{a.text} · {a.by}</span><span className="font-semibold text-success">+{money(a.amount)}</span></li>)}
          </ul>
        </Section>
        <Section title="Ad accounts">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between rounded-lg border border-border p-3"><span>Freebeat US — Meta · act_DEMO_88231</span><Pill tone="success">Assigned</Pill></li>
            <li className="flex justify-between rounded-lg border border-border p-3"><span>Client B — Google Ads · 412-DEMO</span><Pill tone="success">Connected</Pill></li>
            <li className="flex justify-between rounded-lg border border-border p-3"><span>Client B — TikTok (requested)</span><Pill tone="warning">Opening · Anita</Pill></li>
          </ul>
          <div className="mt-5 text-sm font-semibold">Freebeat launch readiness</div>
          <div className="mt-2"><ReadinessPanel /></div>
        </Section>
      </div>
    </div>
  );
}
