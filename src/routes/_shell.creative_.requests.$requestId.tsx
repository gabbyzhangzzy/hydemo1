import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, CheckCircle2, XCircle, MinusCircle, RotateCcw, RefreshCw, Download, Pencil, Paperclip, Sparkles, Bot, User, Cog, PackageCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Empty, PageHeader, Pill, Section, money } from "@/components/demo/bits";
import { actions, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { BRIEF_FIELDS, FORMATS, OBJECTIVES, PLATFORMS, deliverables, deliveryBlockers, estimateCost, latestJobs, missingFields, outputQA, requestJobs, requestStatus, type BriefField, type CreativeBrief } from "@/lib/demo/creative-ops";
import { effectiveApproval } from "@/lib/demo/creative-model";
import { CreativePreview } from "@/components/demo/creative/preview";
import { ReviewPill } from "@/components/demo/creative/detail";
import { DriveBadge } from "@/components/demo/creative/drive";
import { JobStatusPill, RequestStatusPill, visibleClientIds } from "@/components/demo/creative/requests";
import { CAMPAIGNS } from "@/lib/demo/analytics-data";
import { cn } from "@/lib/utils";

type Tab = "brief" | "production" | "deliverables" | "activity";
export const Route = createFileRoute("/_shell/creative_/requests/$requestId")({
  head: () => pageHead("Creative Request", "Brief, production jobs, verified deliverables and activity for one creative request."),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab; edit?: boolean } => ({
    ...(["brief", "production", "deliverables", "activity"].includes(String(s["tab"])) ? { tab: s["tab"] as Tab } : {}),
    ...(s["edit"] === true || s["edit"] === "true" ? { edit: true } : {}),
  }),
  component: RequestDetail,
});

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

function RequestDetail() {
  const { requestId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const s = useDemo();
  const r = s.creativeRequests.find((x) => x.id === requestId && visibleClientIds(s).includes(x.clientId));
  const tab: Tab = search.tab ?? "brief";
  if (!r) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button variant="ghost" size="sm" asChild><Link to="/creative"><ArrowLeft />Creative</Link></Button>
        <Empty title="Request not found">It may belong to a different client context.</Empty>
      </div>
    );
  }
  const status = requestStatus(s, r);
  const client = s.clients.find((c) => c.id === r.clientId)?.name;
  const campaign = CAMPAIGNS.find((c) => c.id === r.campaignId);
  const proposal = [s.campaign, ...s.drafts].find((c) => c?.id === r.campaignId);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" asChild><Link to="/creative"><ArrowLeft />Creative Requests</Link></Button>
      <PageHeader
        eyebrow={<><span className="font-mono">{r.id}</span><span>· {client}</span><span>· via {r.source}</span></>}
        title={r.name}
        sub={<span className="flex flex-wrap items-center gap-2"><RequestStatusPill status={status} /><span>Owner: {r.owner} · Requested by {r.requestedBy} · Deadline {r.brief.deadline ?? "—"}</span></span>}
        right={<>
          {r.taskId && <Button size="sm" variant="outline" asChild><Link to="/tasks"><Bot />Agent Task {r.taskId}</Link></Button>}
          {(campaign || proposal) && <Button size="sm" variant="outline" asChild><Link to="/campaigns/$campaignId" params={{ campaignId: r.campaignId! }}>Campaign: {campaign?.name ?? proposal?.name}</Link></Button>}
          <Button size="sm" variant="outline" asChild><Link to="/workspace">Open in Workspace</Link></Button>
        </>}
      />
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Request sections">
        {(["brief", "production", "deliverables", "activity"] as Tab[]).map((t) => (
          <Button key={t} role="tab" aria-selected={tab === t} variant="ghost" className={cn("rounded-none border-b-2 py-5 capitalize", tab === t ? "border-brand text-foreground" : "border-transparent text-muted-foreground")} onClick={() => navigate({ search: { tab: t } })}>
            {t}{t === "production" ? ` (${requestJobs(s, r.id).length})` : t === "deliverables" ? ` (${deliverables(s, r).length}/${r.brief.quantity ?? "?"})` : ""}
          </Button>
        ))}
      </div>
      {tab === "brief" && <BriefTab rid={r.id} startEdit={!!search.edit} />}
      {tab === "production" && <ProductionTab rid={r.id} />}
      {tab === "deliverables" && <DeliverablesTab rid={r.id} />}
      {tab === "activity" && (
        <Section title="Activity">
          <ol className="space-y-3">
            {r.events.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5">{e.kind === "Agent" ? <Bot className="size-4 text-brand" /> : e.kind === "System" ? <Cog className="size-4 text-muted-foreground" /> : <User className="size-4 text-info" />}</span>
                <div><div>{e.action}</div><div className="text-[11px] text-muted-foreground">{e.actor} · {e.kind} · {fmt(e.at)}</div></div>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

function BriefTab({ rid, startEdit }: { rid: string; startEdit: boolean }) {
  const s = useDemo();
  const r = s.creativeRequests.find((x) => x.id === rid)!;
  const [reply, setReply] = useState("");
  const [edit, setEdit] = useState(startEdit && !r.submitted);
  const [draft, setDraft] = useState<CreativeBrief>(r.brief);
  const [name, setName] = useState(r.name);
  const [picker, setPicker] = useState(false);
  useEffect(() => { if (!edit) { setDraft(r.brief); setName(r.name); } }, [r.brief, r.name, edit]);
  const editable = (s.role === "admin" || s.role === "member") && !r.submitted;
  const missing = missingFields(r.brief);
  const library = s.creativeAssets.filter((a) => a.clientId === r.clientId);
  const approved = (aid: string) => { const a = library.find((x) => x.id === aid); return a?.versions.find((v) => v.number === a.current)?.review === "Approved"; };
  const status = requestStatus(s, r);
  const field = (k: BriefField) => {
    const v = r.brief[k];
    return v === undefined || v === "" ? <span className="text-warning">Missing</span> : <>{String(v)}{r.brief.suggested.includes(k) && <span className="ml-1 text-[10px] text-muted-foreground">(suggested from client context)</span>}</>;
  };
  const input = (k: BriefField) => {
    const opts = k === "objective" ? OBJECTIVES : k === "format" ? FORMATS : k === "platform" ? PLATFORMS : null;
    const val = draft[k] === undefined ? "" : String(draft[k]);
    const set = (v: string) => setDraft((d) => ({ ...d, [k]: k === "quantity" ? Number(v) || undefined : v }) as CreativeBrief);
    return opts
      ? <select aria-label={k} value={val} onChange={(e) => set(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
      : <Input aria-label={k} type={k === "quantity" ? "number" : "text"} min={1} value={val} onChange={(e) => set(e.target.value)} />;
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Section title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-brand" />Brief intake with {r.owner}</span>} right={<Demo>Simulated agent</Demo>}>
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {r.intake.map((m, i) => (
            <div key={i} className={cn("max-w-[90%] rounded-lg p-3 text-sm", m.from === "agent" ? "bg-brand-soft" : "ml-auto bg-muted")}>
              <div className="mb-1 text-[11px] font-semibold text-muted-foreground">{m.by}</div>{m.text}
            </div>
          ))}
        </div>
        {editable && missing.length > 0 && (
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); actions.answerCreativeIntake(r.id, reply); setReply(""); }}>
            <Input aria-label="Reply to the agent" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Answer the question…" />
            <Button type="submit" disabled={!reply.trim()}><Send />Reply</Button>
          </form>
        )}
        {missing.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{missing[0] === "objective" && editable && OBJECTIVES.slice(0, 2).map((o) => <Button key={o} size="sm" variant="outline" onClick={() => actions.answerCreativeIntake(r.id, o)}>{o}</Button>)}</div>}
      </Section>

      <Section title="Brief Card" right={<span className="flex items-center gap-2">{missing.length ? <Pill tone="warning">Needs Info · {missing.length} missing</Pill> : r.confirmed ? <Pill tone="success">Confirmed</Pill> : <Pill tone="brand">Ready to confirm</Pill>}</span>}>
        {edit ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">Request name<Input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <div className="grid gap-3 sm:grid-cols-2">{BRIEF_FIELDS.map((f) => <label key={f.key} className="block text-xs font-semibold text-muted-foreground">{f.label}{input(f.key)}</label>)}</div>
            <label className="block text-xs font-semibold text-muted-foreground">Creative direction<Textarea value={draft.direction ?? ""} onChange={(e) => setDraft((d) => ({ ...d, direction: e.target.value }))} /></label>
            <label className="block text-xs font-semibold text-muted-foreground">Things to avoid<Input value={draft.avoid ?? ""} onChange={(e) => setDraft((d) => ({ ...d, avoid: e.target.value }))} /></label>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={() => { const { suggested: _s, ...patch } = draft; actions.updateCreativeBrief(r.id, patch, name); setEdit(false); }}>Save brief</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Client / Brand</dt><dd>{s.clients.find((c) => c.id === r.clientId)?.name}</dd></div>
              {BRIEF_FIELDS.map((f) => <div key={f.key}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd>{field(f.key)}</dd></div>)}
              <div><dt className="text-xs text-muted-foreground">Creative direction</dt><dd>{r.brief.direction || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Things to avoid</dt><dd>{r.brief.avoid || "—"}</dd></div>
            </dl>
            <div className="border-t border-border pt-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Existing assets · reuse before generating</h3>
              {r.suggestedAssets.length === 0 && r.references.length === 0 && r.reused.length === 0 && <p className="text-xs text-muted-foreground">No approved assets found for this client.</p>}
              <div className="space-y-2">
                {[...new Set([...r.suggestedAssets, ...r.references, ...r.reused])].map((aid) => {
                  const a = library.find((x) => x.id === aid);
                  const v = a?.versions.find((x) => x.number === a.current);
                  if (!a || !v) return null;
                  return (
                    <div key={aid} className="flex items-center gap-3 rounded-md border border-border p-2 text-sm">
                      <img src={v.preview} alt="" className="size-10 rounded object-cover" />
                      <div className="min-w-0 flex-1"><Link to="/creative" search={{ asset: a.id }} className="truncate font-medium hover:text-brand">{a.name}</Link><div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">{a.id} · V{v.number} · {v.format} {v.ratio} <ReviewPill status={v.review} /><DriveBadge asset={a} /></div></div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant={r.references.includes(aid) ? "secondary" : "outline"} className="h-7 text-xs" disabled={!editable} onClick={() => actions.toggleCreativeReference(r.id, aid, "references")}>{r.references.includes(aid) ? "Reference ✓" : "Use as reference"}</Button>
                        <Button size="sm" variant={r.reused.includes(aid) ? "secondary" : "ghost"} className="h-7 text-xs" disabled={!editable || !approved(aid)} onClick={() => actions.toggleCreativeReference(r.id, aid, "reused")}>{r.reused.includes(aid) ? "Reused ✓" : "Reuse as deliverable"}</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {picker && (
                <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {library.filter((a) => ![...r.suggestedAssets, ...r.references, ...r.reused].includes(a.id)).map((a) => (
                    <button key={a.id} className="flex w-full items-center justify-between gap-2 rounded p-1.5 text-left text-xs hover:bg-muted" onClick={() => actions.toggleCreativeReference(r.id, a.id, "references")}>
                      <span className="truncate">{a.name} · {a.id}</span><span className="flex items-center gap-1"><DriveBadge asset={a} />{a.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button variant="outline" disabled={!editable} onClick={() => setEdit(true)}><Pencil />Edit</Button>
              <Button variant="outline" disabled={!editable} onClick={() => setPicker((p) => !p)}><Paperclip />Add References</Button>
              <Button variant="outline" disabled={!editable || missing.length > 0 || r.confirmed} onClick={() => actions.confirmCreativeBrief(r.id)}><CheckCircle2 />{r.confirmed ? "Brief Confirmed" : "Confirm Brief"}</Button>
              <Button variant="brand" disabled={!editable || !r.confirmed || missing.length > 0} onClick={() => actions.submitCreativeProduction(r.id)}><Send />Submit for Production</Button>
            </div>
            {!r.submitted && <p className="text-xs text-muted-foreground">Submitting queues {Math.max(0, (r.brief.quantity ?? 0) - r.reused.length)} generation job(s) · estimated {money(estimateCost(r))} (estimate only, not billed). Nothing is generated before you submit.</p>}
            {r.submitted && <p className="text-xs text-muted-foreground">Submitted — brief is locked. Status: {status}.</p>}
          </div>
        )}
      </Section>
    </div>
  );
}

function costLabel(c: { amount: number | null; state: string }) {
  if (c.state === "Unknown / Pending Reconciliation") return "Unknown / Pending Reconciliation";
  return `${money(c.amount ?? 0)} · ${c.state}${c.state === "Confirmed" ? " (provider-reported, demo)" : ""}`;
}
function ProductionTab({ rid }: { rid: string }) {
  const s = useDemo();
  const r = s.creativeRequests.find((x) => x.id === rid)!;
  const jobs = requestJobs(s, rid);
  const latest = latestJobs(s, r);
  const editable = s.role === "admin" || s.role === "member";
  const active = jobs.some((j) => j.status === "Queued" || j.status === "Running");
  const confirmed = jobs.filter((j) => j.cost.state === "Confirmed").reduce((n, j) => n + (j.cost.amount ?? 0), 0);
  const estimated = jobs.filter((j) => j.cost.state === "Estimated").reduce((n, j) => n + (j.cost.amount ?? 0), 0);
  const unknown = jobs.filter((j) => j.cost.state === "Unknown / Pending Reconciliation").length;
  if (!r.submitted) return <Empty title="Not in production yet">Confirm the brief and submit it for production to create generation jobs.</Empty>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card-surface p-4"><div className="text-xs text-muted-foreground">Assigned</div><div className="mt-1 font-semibold">{r.owner}</div></div>
        <div className="card-surface p-4"><div className="text-xs text-muted-foreground">Confirmed cost</div><div className="mt-1 font-semibold">{money(confirmed)}</div></div>
        <div className="card-surface p-4"><div className="text-xs text-muted-foreground">Estimated (not billed)</div><div className="mt-1 font-semibold">{money(estimated)}</div></div>
        <div className="card-surface p-4"><div className="text-xs text-muted-foreground">Pending reconciliation</div><div className={cn("mt-1 font-semibold", unknown && "text-warning")}>{unknown} job{unknown === 1 ? "" : "s"}</div></div>
      </div>
      <Section title="Generation jobs" right={<span className="flex items-center gap-2"><Demo>Simulated provider</Demo>{active && <Button size="sm" variant="outline" onClick={() => actions.advanceProduction(r.id)}><RefreshCw />Refresh status</Button>}</span>}>
        {jobs.length === 0 && <p className="text-sm text-muted-foreground">All outputs are covered by reused approved assets — no generation jobs were needed.</p>}
        <div className="space-y-3">
          {[...jobs].sort((a, b) => a.slot - b.slot || a.attempt - b.attempt).map((j) => {
            const isLatest = latest.some((x) => x.id === j.id);
            return (
              <div key={j.id} className={cn("rounded-lg border p-3 text-sm", j.status === "Failed" ? "border-danger/40" : j.status === "Outcome Unknown" ? "border-warning/40" : "border-border", !isLatest && "opacity-70")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs">{j.id}</span><span className="font-medium">Output {j.slot} · attempt {j.attempt}</span><JobStatusPill status={j.status} />{j.retryOf && <span className="text-[11px] text-muted-foreground">retry of {j.retryOf}</span>}{!isLatest && <Pill>Superseded — record kept</Pill>}</div>
                  <div className="flex gap-1">
                    {isLatest && ["Failed", "Outcome Unknown", "Cancelled"].includes(j.status) && !r.deliveredAt && <Button size="sm" variant="outline" disabled={!editable} onClick={() => actions.retryProductionJob(j.id)}><RotateCcw />Retry</Button>}
                    {["Queued", "Running"].includes(j.status) && <Button size="sm" variant="ghost" disabled={!editable} onClick={() => actions.cancelProductionJob(j.id)}><Ban />Cancel</Button>}
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <div><dt className="text-muted-foreground">Model / provider</dt><dd>{j.provider}</dd></div>
                  <div><dt className="text-muted-foreground">Format</dt><dd>{j.format}</dd></div>
                  <div><dt className="text-muted-foreground">Started → finished</dt><dd>{fmt(j.startedAt)} → {fmt(j.finishedAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Cost</dt><dd>{costLabel(j.cost)}</dd></div>
                  <div><dt className="text-muted-foreground">Inputs</dt><dd>{j.inputs.join(", ") || "Brief only"}</dd></div>
                  <div><dt className="text-muted-foreground">Output</dt><dd>{j.outputAssetId ? <Link to="/creative" search={{ asset: j.outputAssetId }} className="text-brand hover:underline">{j.outputAssetId}</Link> : "None produced"}</dd></div>
                </dl>
                {j.error && (
                  <div role="alert" className="mt-2 rounded-md bg-danger/10 p-2 text-xs">
                    <p className="font-semibold text-danger">{j.error.message}</p>
                    <p className="text-muted-foreground">Output produced: {j.error.outputProduced ? "Yes" : "No"} · Cause known: {j.error.causeKnown ? "Yes" : "No"} · Retry available: {j.error.retryable ? "Yes" : "No"} · Reuse option: {r.suggestedAssets.length ? `${r.suggestedAssets.length} approved assets can be reused from the Brief tab` : "None found"}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function QAIcon({ st }: { st: "pass" | "fail" | "n/a" }) {
  return st === "pass" ? <CheckCircle2 className="size-3.5 text-success" /> : st === "fail" ? <XCircle className="size-3.5 text-danger" /> : <MinusCircle className="size-3.5 text-muted-foreground" />;
}
function DeliverablesTab({ rid }: { rid: string }) {
  const s = useDemo();
  const r = s.creativeRequests.find((x) => x.id === rid)!;
  const items = deliverables(s, r);
  const blockers = deliveryBlockers(s, r);
  const status = requestStatus(s, r);
  const editable = s.role === "admin" || s.role === "member";
  const missingOutputs = latestJobs(s, r).some((j) => j.status !== "Succeeded") || items.length < (r.brief.quantity ?? 0);
  return (
    <div className="space-y-4">
      <Section title={<span className="flex items-center gap-2"><PackageCheck className="size-4 text-brand" />Verified delivery</span>} right={r.deliveredAt ? <Pill tone="success">Delivered {fmt(r.deliveredAt)} · {r.deliveredBy}</Pill> : missingOutputs && r.submitted ? <Pill tone="danger">Delivery Blocked</Pill> : <RequestStatusPill status={status} />}>
        {r.deliveredAt ? <p className="text-sm">All required outputs passed technical QA and approvals. Delivery recorded by {r.deliveredBy}.</p> : (
          <div className="space-y-2">
            {blockers.length > 0 ? <ul className="space-y-1 text-sm">{blockers.map((b) => <li key={b} className="flex gap-2"><XCircle className="mt-0.5 size-4 shrink-0 text-danger" />{b}</li>)}</ul> : r.submitted && <p className="text-sm text-success">All checks passed — ready to record delivery.</p>}
            <Button variant="brand" disabled={!editable || blockers.length > 0 || status !== "Ready to Deliver"} onClick={() => actions.deliverCreativeRequest(r.id)}><PackageCheck />Verify & Mark Delivered</Button>
            <p className="text-xs text-muted-foreground">Technical QA checks files and metadata only; creative correctness and compliance come from human review.</p>
          </div>
        )}
      </Section>
      {items.length === 0 ? <Empty title="No outputs yet">Outputs appear here when production jobs succeed or approved assets are reused.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({ asset, version, via, jobId }) => {
            const qa = outputQA(version, r.brief.format);
            const ok = qa.every((c) => c.status !== "fail");
            return (
              <article key={asset.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <CreativePreview version={version} />
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>{via}{jobId ? ` · ${jobId}` : ""}</span><DriveBadge asset={asset} /><Demo>Simulated output</Demo></div>
                  <Link to="/creative" search={{ asset: asset.id, version: version.number }} className="block font-semibold hover:text-brand">{asset.name}</Link>
                  <p className="text-xs text-muted-foreground">V{version.number} · {version.format} · {version.ratio} · {(version.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex flex-wrap gap-1"><ReviewPill status={version.review} />{asset.clientRequired && <Pill tone={version.clientApproved ? "success" : "warning"}>{version.clientApproved ? "Client approved" : "Client approval pending"}</Pill>}{effectiveApproval(asset, version) && <Pill tone="success">Approval complete</Pill>}</div>
                  <div className="rounded-md border border-border p-2">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">Output QA <Pill tone={ok ? "success" : "danger"}>{ok ? "Technical checks passed" : "Needs attention"}</Pill></div>
                    <ul className="space-y-0.5 text-[11px]">{qa.map((c) => <li key={c.name} className="flex items-center gap-1.5"><QAIcon st={c.status} /><span className="font-medium">{c.name}</span><span className="text-muted-foreground">— {c.detail}</span></li>)}</ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild><Link to="/creative" search={{ asset: asset.id, version: version.number }}>Review & comment</Link></Button>
                    <Button size="sm" variant="ghost" asChild><a href={version.preview} download={`${asset.id}-v${version.number}-preview.jpg`}><Download />Preview file</a></Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Download is an illustrative preview image, not a production-ready file.</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
