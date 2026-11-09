import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandCard } from "@/components/demo/brand-card";
import { Demo, Empty, PageHeader, Pill, Section } from "@/components/demo/bits";
import { actions, can, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/brand")({
  head: () => pageHead("Brand & Tracking", "Brand profiles and tracking setup for each client."),
  component: BrandPage,
});

function BrandPage() {
  const s = useDemo();
  const cid = s.biz === "direct" ? "direct" : s.clientId === "all" ? "freebeat" : s.clientId;
  const brand = s.brands[cid];
  const client = s.clients.find((c) => c.id === cid);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Business" title={`Brand & Tracking · ${client?.name}`} />
      {brand ? (
        <BrandCard brand={brand} readOnly={!can.editDraft(s.role)} onSave={(b) => actions.setBrand(cid, { ...b, status: brand.status })} onConfirm={(b) => actions.confirmBrand(cid, b)} />
      ) : (
        <Empty title="No brand profile yet">
          <div className="mt-3 flex justify-center gap-2">
            {cid === "freebeat" && <Button size="sm" variant="outline" asChild><Link to="/">Run onboarding</Link></Button>}
            {can.editDraft(s.role) && <Button size="sm" onClick={() => actions.setBrand(cid, { name: client?.name ?? "", description: "Describe the business", industry: "", audience: "", market: "", url: "", assets: [], status: "draft", source: "manual" })}>Create draft profile</Button>}
          </div>
        </Empty>
      )}
      <Section title="Tracking" right={<Demo />}>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between rounded-lg border border-border p-3"><span>Meta Pixel</span><Pill tone={cid === "freebeat" || cid === "clientb" ? "success" : "muted"}>{cid === "freebeat" || cid === "clientb" ? "Installed · events firing" : "Not installed"}</Pill></li>
          <li className="flex justify-between rounded-lg border border-border p-3"><span>App events (MMP)</span><Pill>{cid === "freebeat" ? "AppsFlyer · planned" : "—"}</Pill></li>
        </ul>
      </Section>
    </div>
  );
}
