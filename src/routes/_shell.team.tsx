import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PageHeader, Pill, Section } from "@/components/demo/bits";
import { useDemo } from "@/lib/demo/store";
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
