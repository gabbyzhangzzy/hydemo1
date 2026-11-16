<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Prototype architecture
- All demo data and state transitions live in `src/lib/demo/store.ts` (one client store persisted to localStorage); screens only call `actions.*`, so every page, Slack and Mobile preview stay consistent.
- The main task's status is derived from campaign/access state (`mainTaskView`) rather than stored, so it can never disagree across screens.
- App pages live under the pathless `_shell` layout; the public acquisition routes render outside it: `/` (marketing homepage), `/signin` (simulated SSO — local demo identity only, never real OAuth) and `/onboarding` (adaptive onboarding; homepage CTAs preselect the customer type via `acquisition` in the store).
- `/workspace` renders in immersive mode: AppShell hides its header and collapses the sidebar to an icon rail; the workspace supplies its own header and gets prototype utilities via `useShellUtils()`, so secondary panels open as drawers instead of permanent columns.
- Creative metadata, version reviews, policy decisions and associations remain in the shared demo store; browser file blobs use IndexedDB, so uploads remain local without bloating shared state.
- Creative delivery and performance resolve version-pinned associations through the existing Analytics dataset; new assignments never alter deployed ads or trigger launch.
- The Campaigns hub (`/campaigns`) merges workflow proposals (store Campaign records) with delivery campaigns (Analytics dataset) via `src/lib/demo/campaign-hub.ts`; proposals never show invented metrics. `/campaigns/$campaignId` nests under the hub route, so the hub renders `<Outlet />` when a detail path matches.
- Direct Customer mode (`biz === "direct"`) has exactly one customer-facing AI participant: AI AM. `sendChannelMessage`/`startGenericTask`/`creativeTask` route every direct request through AI AM (intercepting specialist @mentions and stripping @prefixes), so UA/Creative/Clayton never speak in direct conversations; agency mode keeps full multi-agent collaboration. `personFor` returns null in direct mode and `directUser` supplies the company identity — never a BlueFocus persona.
- Creative Requests, production jobs, output QA, delivery gating and simulated Google Drive sync live as pure functions in `src/lib/demo/creative-ops.ts`; the store only wraps them in `actions.*`, and request status is derived (`requestStatus`), so Creative page, Workspace and Campaign entry points share one request object and cannot disagree.
- The P0 card workflow (#freebeat-growth Guided Demo) lives as pure functions in `src/lib/demo/p0-flow.ts` on `state.p0`; cards in `src/components/demo/p0/cards.tsx` only call `actions.p0(fn)`, and step progress is derived (`completedSteps`), so cards, progress bar and Next Step cannot disagree.
