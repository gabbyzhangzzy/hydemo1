import { useState } from "react";
import { HardDrive, RefreshCw, Folder, CheckCircle2, AlertTriangle, Image as ImageIcon, Video, ChevronRight, Unplug, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Demo, Pill } from "@/components/demo/bits";
import { actions, useDemo } from "@/lib/demo/store";
import { orgName, type DriveResult } from "@/lib/demo/creative-ops";
import type { CreativeAsset } from "@/lib/demo/creative-model";

export function DriveBadge({ asset }: { asset: CreativeAsset }) {
  if (!asset.drive) return null;
  const st = asset.drive.status;
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      <HardDrive className="size-3 text-info" />Google Drive
      {st !== "Synced" && <Pill tone={st === "Source update available" ? "warning" : "danger"}>{st === "Source update available" ? "Source updated" : "Source removed"}</Pill>}
    </span>
  );
}

function ResultSummary({ res }: { res: DriveResult }) {
  if (res.error) return <p role="alert" className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><ShieldAlert className="size-4" />{res.error}</p>;
  return (
    <div role="status" className="space-y-1 rounded-md border border-border bg-muted/40 p-3 text-sm">
      <p><strong>{res.imported.length}</strong> imported · <strong>{res.skipped.length}</strong> unchanged (skipped) · <strong>{res.updated.length}</strong> source updates · <strong>{res.failed.length}</strong> failed</p>
      {res.updated.length > 0 && <p className="text-warning">Source file updated. Review the new version before using it.</p>}
      {res.failed.map((f) => <p key={f.name} className="flex items-start gap-1 text-danger"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{f.name} — {f.reason}</p>)}
    </div>
  );
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never");

export function DriveImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useDemo();
  const clients = s.clients.filter((c) => (s.biz === "direct" ? c.id === "direct" : c.biz === s.biz));
  const [cid, setCid] = useState(s.biz === "direct" ? "direct" : s.clientId === "all" ? "freebeat" : s.clientId);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [res, setRes] = useState<DriveResult | null>(null);
  const admin = s.role === "admin";
  const allowed = s.role === "admin" || s.role === "member";
  const folders = s.drive.folders.filter((f) => f.clientId === cid);
  const unmapped = s.drive.folders.filter((f) => f.clientId === null);
  const folder = s.drive.folders.find((f) => f.id === folderId && f.clientId === cid);
  const files = folder ? s.drive.files.filter((f) => f.folderId === folder.id && !f.removed) : [];
  const imported = (fid: string) => s.creativeAssets.some((a) => a.drive?.fileId === fid && a.clientId === cid);
  const clientName = clients.find((c) => c.id === cid)?.name ?? cid;
  const close = () => { setFolderId(null); setSel([]); setRes(null); onClose(); };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HardDrive className="size-5 text-info" />Import from Google Drive <Demo>Simulated connection</Demo></DialogTitle>
          <DialogDescription>Connect Google Drive to import and sync creative assets for this client. This prototype uses a simulated Drive — no Google account, password or token is used.</DialogDescription>
        </DialogHeader>
        {!s.drive.connected ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-6 text-center">
            <HardDrive className="mx-auto size-8 text-info" />
            <p className="text-sm">Google Drive is not connected for {orgName(s)}.</p>
            <p className="text-xs text-muted-foreground">A production integration would request least-privilege, folder-scoped access approved by an Admin.</p>
            <Button variant="brand" disabled={!admin} onClick={() => actions.connectDrive()}>Connect Google Drive (simulated)</Button>
            {!admin && <p className="text-xs text-muted-foreground">Only an Admin can create an organization-level Drive connection.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />Connected: {s.drive.account}{s.drive.connectedBy ? ` · by ${s.drive.connectedBy}` : ""}</span>
              <label className="flex items-center gap-2">Client
                <select aria-label="Drive import client" value={cid} onChange={(e) => { setCid(e.target.value); setFolderId(null); setSel([]); setRes(null); }} className="h-8 rounded-md border border-input bg-background px-2">
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <p className="flex items-center gap-1 text-xs font-semibold" aria-label="Import destination">Destination: {orgName(s)} <ChevronRight className="size-3" /> {clientName} <ChevronRight className="size-3" /> Creative Library</p>
            {!folder ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Authorized folders mapped to {clientName}</h3>
                {folders.length === 0 && <p className="text-sm text-muted-foreground">No folders mapped to this client yet.</p>}
                {folders.map((f) => (
                  <Button key={f.id} variant="outline" className="h-auto w-full justify-between p-3" onClick={() => { setFolderId(f.id); setSel([]); setRes(null); }}>
                    <span className="flex items-center gap-2"><Folder className="size-4 text-info" />{f.name}</span>
                    <span className="text-xs text-muted-foreground">{s.drive.files.filter((x) => x.folderId === f.id && !x.removed).length} files · {f.status}</span>
                  </Button>
                ))}
                {unmapped.length > 0 && (
                  <div className="rounded-md border border-border p-3 text-xs">
                    <p className="mb-2 font-semibold">Unmapped folders — not importable until an Admin maps them to a client</p>
                    {unmapped.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><Folder className="size-3.5" />{f.name}</span>
                        <Button size="sm" variant="ghost" disabled={!admin} onClick={() => actions.mapDriveFolder(f.id, cid)}>Map to {clientName}</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setFolderId(null); setRes(null); }}>← Folders</Button>
                  <span className="text-sm font-semibold">{folder.name}</span>
                  <Button size="sm" variant="outline" onClick={() => setSel(sel.length === files.length ? [] : files.map((f) => f.id))}>{sel.length === files.length ? "Clear selection" : "Select all"}</Button>
                </div>
                <div className="divide-y divide-border rounded-md border border-border">
                  {files.map((f) => (
                    <label key={f.id} className="flex cursor-pointer items-center gap-3 p-2 text-sm hover:bg-muted/40">
                      <input type="checkbox" aria-label={`Select ${f.name}`} checked={sel.includes(f.id)} onChange={() => setSel((x) => (x.includes(f.id) ? x.filter((i) => i !== f.id) : [...x, f.id]))} />
                      <img src={f.preview} alt="" className="size-10 rounded object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{f.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">{f.format === "Video" ? <Video className="size-3" /> : <ImageIcon className="size-3" />}{f.mime} · {f.width}×{f.height}{f.duration ? ` · ${f.duration}s` : ""} · {(f.size / 1024 / 1024).toFixed(1)} MB · rev {f.revision}</div>
                      </div>
                      {imported(f.id) && <Pill tone="success">Imported</Pill>}
                    </label>
                  ))}
                </div>
                {res && <ResultSummary res={res} />}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" disabled={!allowed} onClick={() => setRes(actions.syncDriveFolder(folder.id))}><RefreshCw />Sync This Folder</Button>
                  <Button variant="brand" disabled={!allowed || sel.length === 0} onClick={() => { setRes(actions.importDriveFiles(folder.id, sel, cid)); setSel([]); }}>Import Selected ({sel.length})</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DriveFoldersPanel() {
  const s = useDemo();
  const [results, setResults] = useState<Record<string, DriveResult>>({});
  const [details, setDetails] = useState(false);
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === s.biz).map((c) => c.id) : [s.clientId];
  const folders = s.drive.folders.filter((f) => f.clientId && ids.includes(f.clientId) && (f.synced || f.status === "Authorization Required"));
  const admin = s.role === "admin";
  if (!s.drive.connected && folders.length === 0) return null;
  return (
    <section className="card-surface space-y-3 p-4" aria-label="Google Drive sync">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><HardDrive className="size-4 text-info" />Google Drive · connected folders <Demo>Simulated</Demo></h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDetails((d) => !d)}><Info />Connection details</Button>
          {s.drive.connected && <Button size="sm" variant="ghost" disabled={!admin} onClick={() => actions.disconnectDrive()}><Unplug />Disconnect</Button>}
        </div>
      </div>
      {details && <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">Account: {s.drive.account} · Owner: {s.drive.connectedBy ?? "—"} · Connected {fmt(s.drive.connectedAt)} · Scope: Admin-approved, client-mapped folders only (simulated). Sync is one-way Drive → Hellyeah and runs only when you click Sync Now — no background sync is running.</p>}
      {folders.length === 0 && <p className="text-xs text-muted-foreground">No synced folders yet. Use “Import from Google Drive” → “Sync This Folder”.</p>}
      {folders.map((f) => {
        const count = s.creativeAssets.filter((a) => a.drive?.folderId === f.id).length;
        const res = results[f.id];
        const auth = f.status === "Authorization Required";
        return (
          <div key={f.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 font-medium"><Folder className="size-4 text-info" />{f.name} <Pill tone={auth ? "danger" : f.status === "Partial failure" ? "warning" : "success"}>{f.status}</Pill></div>
                <div className="text-[11px] text-muted-foreground">{s.drive.account} → {s.clients.find((c) => c.id === f.clientId)?.name} · Last synced {fmt(f.lastSynced)} · {count} imported assets{f.lastResult ? ` · last run: ${f.lastResult.imported} new, ${f.lastResult.skipped} unchanged, ${f.lastResult.updated} updated, ${f.lastResult.failed} failed` : ""}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {auth ? <Button size="sm" variant="brand" disabled={!admin} onClick={() => { if (!s.drive.connected) actions.connectDrive(); else actions.simulateDrive(f.id, "restore"); }}>Reconnect</Button>
                  : <Button size="sm" variant="outline" onClick={() => setResults((r) => ({ ...r, [f.id]: actions.syncDriveFolder(f.id) }))}><RefreshCw />Sync Now</Button>}
              </div>
            </div>
            {f.errors.length > 0 && <ul className="space-y-1 text-xs text-danger">{f.errors.map((e) => <li key={e.fileId} className="flex gap-1"><AlertTriangle className="mt-0.5 size-3 shrink-0" />{e.name} — {e.reason}</li>)}</ul>}
            {res && <ResultSummary res={res} />}
            {admin && s.drive.connected && (
              <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
                Demo — simulate a Drive change:
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => actions.simulateDrive(f.id, "update")}>Update a source video</Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => actions.simulateDrive(f.id, "remove")}>Remove a file</Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => actions.simulateDrive(f.id, "revoke")}>Revoke folder access</Button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
