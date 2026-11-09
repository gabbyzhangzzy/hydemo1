import { createFileRoute } from "@tanstack/react-router";
import { Check, MailPlus, Minus } from "lucide-react";
import { PageHeader, Pill, Section } from "@/components/demo/bits";
import { actions, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/team")({
  head: () => pageHead("Organization & Team", "Members, roles and permissions for your organization."),
  component: Team,
});

const PERMS: [string, boolean, boolean][] = [
  ["Create & edit campaign drafts", true, true],
  ["Submit approval requests", true, true],
  ["Final launch approval", true, false],
  ["Fund Wallet", true, false],
  ["Add clients", true, false],
  ["Enable client-facing AI AM (preview)", true, false],
];

function Team() {
  const s = useDemo();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Settings" title="Organization & Team" sub="Two roles only: Admin and Member. Permissions also respect the selected client." />
      <Section title="Members · BlueFocus">
        <ul className="divide-y divide-border text-sm">
          {[["Maya Chen", "Admin", "All clients"], ["Leo Park", "Member", "Freebeat, Demo Client B"]].map(([n, r, c]) => (
            <li key={n} className="flex justify-between py-2.5"><span className="font-medium">{n}</span><span className="text-muted-foreground">{c}</span><Pill tone={r === "Admin" ? "brand" : "muted"}>{r}</Pill></li>
          ))}
        </ul>
      </Section>
      {s.invites.length > 0 && (
        <Section title="Invitations (simulated)">
          <ul className="divide-y divide-border text-sm">
            {s.invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-medium">{inv.email}</span>
                <span className="text-muted-foreground">{inv.fn} · {s.clients.find((c) => c.id === inv.clientId)?.name ?? inv.clientId}</span>
                <span className="flex items-center gap-2">
                  <Pill tone={inv.status === "accepted" ? "success" : "warning"}>{inv.status === "accepted" ? "Accepted" : "Pending"}</Pill>
                  {inv.status === "pending" && (
                    <button className="text-xs text-info hover:underline" onClick={() => actions.acceptInvite(inv.id)}>simulate accept</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MailPlus className="size-3.5" /> Invitations are simulated — no real emails are sent. Work functions are labels; permissions stay Admin / Member.</p>
        </Section>
      )}
      <Section title="Permissions">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Action</th><th className="text-center">Admin</th><th className="text-center">Member</th></tr></thead>
          <tbody className="divide-y divide-border">
            {PERMS.map(([a, ad, m]) => (
              <tr key={a}><td className="py-2">{a}</td><td className="text-center">{ad ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4" />}</td><td className="text-center">{m ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground" />}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">You are viewing as {s.role}. Ops and End Client are external roles, not organization roles.</p>
      </Section>
    </div>
  );
}
