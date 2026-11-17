# feat(credits): take over the embedded agent's credit exhaustion and ship the SDK's credits flows in the LMS

## Summary

The LMS now reuses the SDK's whole credits module instead of leaving it to the embedded agent. When the agent inside a course (or the sidebar chat) runs out of credits, the host page opens the next step at page size: Billing for an admin, the plan picker for a free-trial user, the contact-your-admin notice for everyone else. The same routing serves the LMS's own API 402s and the sidebar's free-trial gate, the nav bar carries the SDK credit balance beside the bell, and the plan picker's bullets come from env like on OS.

| | |
| --- | --- |
| Files | 24 changed, +960 / −34 (2 new: `components/credit-exhaustion-handler.tsx` and its test) |
| Depends on | `@iblai/iblai-js` ≥ the release of `feat/web-utils/credit-exhaust-host-relay`, `@iblai/agent-ai` with `handlecreditexhaustion` (same branch); the OS release that relays the frame |
| Tests | 3,803 passed (400 files); 41 new across 8 suites |
| Typecheck | clean against the built SDK packages |
| E2E coverage | 281 → 284 checkpoints (embed-05, nav-13, nav-14), 100% |

## What a person sees

- **Out of credits in the embedded agent.** The chat shows the SDK's toast; nothing opens inside the widget. On the page: an admin lands on the Billing tab of the profile modal (`?profileTab=billing`), a free-trial user gets "Choose Your Plan", a learner gets "Your organization has run out of credits" with Contact Now.
- **Out of credits on an LMS call.** Same three outcomes. A course paywall 402 still opens the paywall as before.
- **Nav bar.** A live admin (or free-trial user) of a paywall tenant sees the SDK credit balance just left of the notification bell: the chip with its status dot, and a dropdown with Remaining, Auto Recharge, Billing, Change Plan, Manage Usage and Add Credits.
- **Sidebar, free-trial user.** The whole admin cluster shows (Studio, Analytics, Invites, Management, API, Secrets, Monetization, Advanced), as on OS; clicking any entry opens the plan picker. Notifications stays a real action.
- **Plan picker.** Each card's bullets come from `NEXT_PUBLIC_PLAN_FEATURES_{FREE,PRO,MAX,ULTRA}`, with LMS defaults in `.env.example` drawn from the LMS overview docs.

## How the relay reaches the page

1. Both embeds set `handleCreditExhaustion: true` on `<agent-ai>`; the element tells the agent on `loaded`.
2. The agent's 402 becomes a `credits.exhausted` frame posted to this window; the element re-dispatches it as the `creditsexhausted` DOM event, only when it came from its own iframe.
3. `CreditExhaustionHandler` listens on `document`, hands the frame to the SDK's `handle402Error`, and renders `UpgradePackageModal` and `ContactAdminModal` from the `subscription` slice.
4. For an admin, the SDK's default `openBillingTab` puts `profileTab=billing` in the URL; the sidebar opens the profile modal on Billing and removes the parameter when it closes (`router.replace`, `{ scroll: false }`, as OS does).

## Implementation

| Area | Files | Change |
| --- | --- | --- |
| Embeds | `components/course-agent-chat.tsx`, `components/chat-button.tsx` | `handleCreditExhaustion: true` on every `<agent-ai>`. |
| Host handler | `components/credit-exhaustion-handler.tsx` (new), `app/_components/app-layout.tsx` | Listener + the two SDK modals; mounted for every signed-in page as a dynamic import, next to the paywall wrapper. |
| Store | `lib/store.ts` | `subscription`, `topBanner`, `appleRestriction` reducers from web-utils. |
| Config | `providers/index.tsx`, `lib/config.ts`, `.env.example`, `entrypoint.sh` | `SubscriptionConfigProvider` with the main tenant key, agent URL, Stripe switch, support address and `planFeatures`; new `NEXT_PUBLIC_STRIPE_ENABLED` (default true) and the four `NEXT_PUBLIC_PLAN_FEATURES_*` lists (`\|`-separated, `**bold**`), parsed like OS. |
| LMS 402s | `providers/index.tsx` | `isPaywallResponse` tells a paywall body (`has_access`, `item_type`, `pricing`) from a credits body; the former still goes to `setAccessCheckResponse`, the latter to `handle402Error` through a ref so the one-time data-layer callback follows the live hook. |
| Nav bar | `components/nav-bar.tsx` | `creditBalance` config on `PlatformNavbar`: tenant, paywall flag, Stripe switch, live admin (`isPlatformAdmin && isInstructorMode`, the same rule as notifications), free-trial state, identity. The visibility formula stays in the SDK. |
| Sidebar | `components/app-sidebar/index.tsx` | `useShowFreeTrialDialog`: `showTrialGatedAdminMenu` on the footer, Studio and Analytics as gated flat rows for trial users, every admin footer action through `executeWithTrialCheck`; `profileTab=billing` opens the profile on Billing. |

## Tests

- `credit-exhaustion-handler.test.tsx`: the frame reaches `handle402Error`, events without a frame are ignored, the listener stops on unmount, the picker gets tenant/main key/email/redirect, both modals close through the slice.
- `app-sidebar` tests: Billing by URL (open, close removes the parameter, keeps other parameters, leaves a rail-opened profile alone); the free-trial gate (footer flag, Studio and Analytics for a trial user, Management and Invites and Analytics through the gate without opening anything, Notifications ungated, nothing extra for a plain learner, a real admin still opens the sheet).
- `nav-bar` tests: the credit balance config as fed to the SDK, live admin vs learner preview, trial user, missing tenant, logged out.
- `providers` tests: `isPaywallResponse`, and the 402 callback routing credits to the SDK and the paywall to the slice.
- `course-agent-chat` and `chat-button` tests: the attribute on each embed. `store`, `config` (Stripe switch default, plan-feature parsing) and `app-layout` tests updated.
- E2E: journey 37 checkpoint 5 (a dispatched frame opens the credits flow), journey 22 checkpoints 13 (the chip beside the bell and its dropdown) and 14 (free-trial user sees the cluster, Management opens the picker; skips for other accounts).

## Verification

Live on localhost (LMS 3001 embedding OS 3000, ORG backend), with the SDK and OS branches on yalc builds:

- Handshake observed from the page: the element sent `MENTOR:HANDLE_CREDIT_EXHAUSTION: true` on each `loaded`.
- Tenant `babatunde` (admin), credits zeroed: one message in the embedded agent produced the frame with the backend's pricing table and opened Billing at 0 credits; nothing opened inside the widget.
- The chip appeared left of the bell ("0 credits remaining", critical dot; later "70,000" and "Max" after the plan change) with the full dropdown; Change Plan opened "Change Your Plan" with the env bullets.
- Tenant `main` (free-trial account): the sidebar showed the admin cluster; Management opened "Choose Your Plan" instead of the Management sheet.
- Full unit suite 3,803 passed; typecheck clean; coverage check 284 of 284.

## Before merging

- Merge after the SDK and OS releases, then move `package.json` back to the published `@iblai/iblai-js` and `@iblai/agent-ai`. This worktree points the five SDK packages at yalc `file:` copies, with a "LOCAL ONLY" overrides block at the top of `pnpm-workspace.yaml` so pnpm resolves one instance of each; strip both, plus the `.npmrc` edits (they carry an npm token), before committing.
- Set `NEXT_PUBLIC_PLAN_FEATURES_*` per deployment if the LMS defaults are not wanted; unset keeps the SDK's bullets. Which feature sits on which tier is copy, not enforcement.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
