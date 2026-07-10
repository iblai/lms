# SkillsAI E2E Coverage — User Journey Checklist

> Last updated: 2026-06-12 | 225 checkpoints | 32 journeys | 100% covered

## How This Works

Each **checkpoint** maps to a concrete user action or verification within a spec file.
Coverage = `covered_checkpoints / total_checkpoints * 100`.

When adding a new page or modifying an existing user flow:

1. Add checkpoints to the relevant journey below (or create a new journey)
2. Write Playwright tests for each checkpoint
3. Mark the checkpoint `[x]` once the test is in the suite and passing
4. The pre-push hook and CI workflow will block pushes with uncovered routes

---

## Journey 1: Authentication (4 checkpoints) — `journeys/01-authentication.spec.ts`

**Source files:** `app/sso-login/page.tsx`, `app/sso-login-complete/page.tsx`

- [x] Unauthenticated user is redirected to SSO login page when accessing a protected route
- [x] User can authenticate via SSO and is redirected to /sso-login-complete
- [x] After SSO completion, user is redirected to /home or /start based on account state
- [x] Unauthenticated user accessing /home directly is redirected to /sso-login

---

## Journey 2: Onboarding — First-Time User (5 checkpoints) — `journeys/02-onboarding-first-time-user.spec.ts`

**Source files:** `app/start/page.tsx`, `app/home/page.tsx`, `app/platform/[tenant]/start/page.tsx`, `app/platform/[tenant]/home/page.tsx`

- [x] First-time user is directed to the /start onboarding page after authentication
- [x] Onboarding page displays welcome content and interest selection UI
- [x] User can complete onboarding steps and proceed to the home dashboard
- [x] Returning user bypasses onboarding and lands directly on /home
- [x] Onboarding page has proper heading and navigation elements

---

## Journey 3: Home Dashboard (8 checkpoints) — `journeys/03-home-dashboard.spec.ts`

**Source files:** `app/home/page.tsx`, `components/home/home-hero.tsx`, `components/home/home-activity-overview.tsx`, `components/home/home-discover-rail.tsx`, `components/suggested-courses.tsx`, `components/my-courses.tsx`

- [x] Home page loads with the hero greeting band and primary CTAs (Explore Catalog / My Courses)
- [x] Suggested Courses section displays course cards or empty state
- [x] My Courses section displays enrolled course cards in a grid
- [x] Clicking a course card in My Courses navigates to the course about page
- [x] Clicking a suggested course card navigates to the course about page
- [x] Activity Overview band shows the profile activity stats with a View Activity link
- [x] "View All" or "See more" links in course sections navigate to appropriate pages
- [x] Home page loads without console errors

---

## Journey 4: Course About & Configuration (11 checkpoints) — `journeys/04-course-about-and-configuration.spec.ts`

**Source files:** `app/courses/[course_id]/page.tsx`, `components/course-access-guard.tsx`

- [x] Course about page loads with course title heading (h1) visible
- [x] Course description, instructor info, and enrollment details are displayed
- [x] "Access Course" button is visible for enrolled users and navigates to course content
- [x] Enrollment button is shown for non-enrolled users
- [x] Configuration tab is visible for admin users on the course about page _(admin only)_
- [x] Configuration tab displays Credentials section with "Add Credential" button _(admin only)_
- [x] Credential creation modal opens with required form fields and can be cancelled _(admin only)_
- [x] Advanced Settings section expands/collapses and displays search + settings list _(admin only)_
- [x] Advanced Settings search filters settings; clearing restores the full list _(admin only)_
- [x] Save Changes button appears when settings are modified and saves successfully _(admin only)_
- [x] Authoring tab links to `<studio-url>/course/<course-id>` and opens in a new tab _(admin only)_

---

## Journey 5: Course Content — Tab Navigation & Iframes (23 checkpoints) — `journeys/05-course-content-tabs.spec.ts`

**Source files:** `app/course-content/[course_id]/course/page.tsx`, `app/course-content/[course_id]/agent/page.tsx`, `app/course-content/[course_id]/progress/page.tsx`, `app/course-content/[course_id]/dates/page.tsx`, `app/course-content/[course_id]/discussion/page.tsx`, `app/course-content/[course_id]/instructor/page.tsx`, `app/course-content/[course_id]/bookmarks/page.tsx`, `app/course-content/[course_id]/layout.tsx`, `components/course-lesson-navigator.tsx`, `components/course-agent-chat.tsx`, `components/course-access-guard.tsx`, `components/edx-iframe/edx-iframe.tsx`, `hooks/courses/edx-iframe-context.ts`, `services/course-metadata.ts`

- [x] Course content page loads with Course, Progress, Dates, and Discussion tab links visible
- [x] Course tab displays an iframe with edX course content loaded
- [x] Progress tab displays an iframe with "Your progress" and "Grade summary" headings
- [x] Dates tab displays an iframe with "Important dates" heading
- [x] Discussion tab displays an iframe with "My posts", "All posts", "Topics", "Learners" links
- [x] Discussion tab shows thread list or "Nothing here yet" empty state
- [x] "Add a post" button opens the post creation form with Discussion radio selected by default
- [x] A new discussion post can be created with a title and content via the rich text editor
- [x] Instructor tab loads iframe content when present _(skips gracefully if tab absent)_
- [x] Bookmarks tab is accessible from the course content navigation _(if available)_
- [x] URL updates correctly when switching between tabs
- [x] No error messages (Bad request, 500, Server error) appear on any course tab
- [x] Agent tab is visible when `course.agent_content_mode === true` and its link points at `/course-content/<id>/agent`
- [x] `/agent` route mounts the `<agent-ai>` chat full-width and keeps the edX iframe attached but hidden via Tailwind's `hidden` class
- [x] `CourseAccessGuard` redirects to `/error/403` when visiting `/agent` on a course where `agent_content_mode !== true`
- [x] Previous / Keep Learning buttons in the tabs row switch units and flip the URL's `unit_id`
- [x] Switching units on the `/agent` tab fires the `Switched to "<unit>"` confirmation toast
- [x] Switching units on the `/agent` tab posts a `MENTOR:CHAT_ACTION_ADD_MESSAGE` into the `<agent-ai>` shadow-root iframe and the agent renders an AI response
- [x] New-chat button on the `/agent` tab renders once the mentor spinner is hidden, posts `MENTOR:NEW_CHAT`, and surfaces the iframe's `.chat-welcome-button`
- [x] Learning/Assessment toggle on `/agent` only renders when `getCourseBlockDetails` returns a block of `type=ibl_mentor_xblock`
- [x] Toggling Assessment mode on `/agent` hides the agent chat and reveals the edX iframe; toggling back to Learning reverses it
- [x] On mobile viewports the toggle is reachable through a vertical 3-dot popover trigger that opens a Popover containing the same switch
- [x] Authoring tab links to `<studio-url>/course/<course-id>` and opens in a new tab _(admin only)_

---

## Journey 6: Public Profile (6 checkpoints) — `journeys/06-profile-activity.spec.ts`

**Source files:** `app/profile/public/page.tsx`, `app/profile/layout.tsx`, `components/profile-tabs.tsx`

- [x] Public Profile tab is active on /profile/public
- [x] About section displayed by default
- [x] User name heading is displayed
- [x] Profile navigation tabs (Activity, Skills, Credentials, Pathways, Programs, Courses) are visible
- [x] Tab navigation works between profile sub-routes
- [x] Public profile has content tabs (About, Education, Experience)

---

## Journey 7: Profile — Skills (5 checkpoints) — `journeys/07-profile-skills.spec.ts`

**Source files:** `app/profile/skills/page.tsx`, `components/skill-box.tsx`, `components/default-empty-box.tsx`

- [x] Skills page loads with Earned, Self-Reported, and Desired sections
- [x] Skill cards show name or empty state message
- [x] Clicking self-reported skill opens detail modal
- [x] Skill detail modal can be closed
- [x] Add Skill button opens dialog

---

## Journey 8: Profile — Credentials (5 checkpoints) — `journeys/08-profile-credentials.spec.ts`

**Source files:** `app/profile/credentials/page.tsx`, `components/credential-box.tsx`

- [x] Credentials page (/profile/credentials) loads and displays credentials or empty state
- [x] Credential cards display credential name, issuer, and badge/certificate image
- [x] Clicking a credential card opens a detail modal with full credential information
- [x] Credential detail modal can be closed
- [x] Download or share button is available for issued credentials _(if applicable)_

---

## Journey 9: Profile — Pathways (5 checkpoints) — `journeys/09-profile-pathways.spec.ts`

**Source files:** `app/profile/pathways/page.tsx`, `components/pathway-detail-modal.tsx`

- [x] Pathways page (/profile/pathways) loads and displays learning pathways or empty state
- [x] Pathway cards display pathway name, description, and progress indicator
- [x] Clicking a pathway card opens a detail modal showing pathway steps/courses
- [x] Pathway detail modal can be closed
- [x] "Create Pathway" button is visible for users with appropriate permissions _(admin only)_

---

## Journey 10: Profile — Programs (10 checkpoints) — `journeys/10-profile-programs.spec.ts`

**Source files:** `app/profile/programs/page.tsx`, `app/programs/[program_id]/page.tsx`

- [x] Programs page (/profile/programs) loads with "My programs" tab visible
- [x] Program cards display or "No programs found." empty state is shown
- [x] Clicking a program card navigates to the program detail page at `/programs/[program_id]`
- [x] Program detail page displays the program name heading and card image
- [x] Browser back from the detail page returns to /profile/programs
- [x] Admin users see About, Courses, and Settings tabs with About selected by default _(admin only)_
- [x] Settings tab displays form sections: Basic Information, Pricing & Dates, Visibility & Access, Images, Social & Promotion _(admin only)_
- [x] Switching between About → Courses → Settings tabs updates content correctly _(admin only)_
- [x] Clicking a course card on the program detail page navigates to the course page
- [x] "My programs" and "Assigned programs" tabs can be toggled _(if both available)_

---

## Journey 11: Profile — Courses (4 checkpoints) — `journeys/11-profile-courses.spec.ts`

**Source files:** `app/profile/courses/page.tsx`

- [x] Courses page (/profile/courses) loads and displays the user's enrolled courses or empty state
- [x] Course cards show course name, progress, and organization info
- [x] Clicking a course card navigates to the course about page
- [x] Pagination or "Load more" works when the user has many courses

---

## Journey 12: Profile — Public (3 checkpoints) — `journeys/12-profile-public.spec.ts`

**Source files:** `app/profile/public/page.tsx`

- [x] Public profile page (/profile/public) loads and displays the user's public-facing information
- [x] Public profile shows user name, bio/about, and visible skills or credentials
- [x] Public profile page has appropriate heading and does not expose private information

---

## Journey 13: Recommended Courses (5 checkpoints) — `journeys/13-recommended-courses.spec.ts`

**Source files:** `app/recommended/page.tsx`

- [x] Recommended page (/recommended) loads and displays recommended course cards or empty state
- [x] Recommended course cards show course title, description, and thumbnail
- [x] Clicking a recommended course card navigates to the course about page
- [x] Recommendations are personalized (different from generic catalog results)
- [x] Page has proper heading and section labels

---

## Journey 14: Course Discovery (8 checkpoints) — `journeys/14-course-discovery.spec.ts`

**Source files:** `app/discover/page.tsx`, `components/discover-content-card.tsx`

- [x] Discover page (/discover) loads with course catalog cards and search input
- [x] Search input filters the course catalog by title/keyword
- [x] Faceted filters (subject, level, availability) are visible and functional
- [x] Applying a filter narrows the displayed course results
- [x] Clearing filters restores the full catalog
- [x] Clicking a course card navigates to the course about page
- [x] Filter drawer opens and closes on mobile viewport _(if applicable)_
- [x] Pagination or infinite scroll loads additional courses

---

## Journey 15: Notifications (7 checkpoints) — `journeys/15-notifications.spec.ts`

**Source files:** `app/notifications/page.tsx`, `app/notifications/[notificationId]/page.tsx`

- [x] Notification bell icon is visible in the NavBar
- [x] Clicking the notification bell opens the notifications dropdown with recent notifications
- [x] Clicking "View All" or navigating to /notifications shows the full notification list
- [x] Notification list displays notification titles, timestamps, and read/unread indicators
- [x] Clicking a notification navigates to the notification detail page
- [x] Notification detail page displays the full notification content
- [x] "Mark all as read" button is visible and functional

---

## Journey 16: Analytics Overview (6 checkpoints) — `journeys/16-analytics-overview.spec.ts`

**Source files:** `app/analytics/page.tsx`, `app/analytics/layout.tsx`, `app/loading.tsx`, `components/analytics-sidebar.tsx`, `components/spinner.tsx`

- [x] Analytics page (/analytics) loads with an Overview tab and summary dashboard _(admin only)_
- [x] Overview displays key metrics cards (users, courses, engagement stats)
- [x] Analytics sidebar tabs (Overview, Users, Courses, Programs, Topics, Transcripts, Financial, Data Reports) are visible
- [x] Time filter controls are functional and update dashboard data
- [x] Groups filter dropdown is visible and can filter analytics by user groups
- [x] Global suspense loader (`app/loading.tsx` + `components/spinner.tsx`) hides before analytics content renders

---

## Journey 17: Analytics Users (5 checkpoints) — `journeys/17-analytics-users.spec.ts`

**Source files:** `app/analytics/users/page.tsx`, `app/analytics/users/registered/page.tsx`, `app/analytics/users/active/page.tsx`, `app/analytics/users/at-risk/page.tsx`

- [x] Users analytics page (/analytics/users) loads with user metric cards and charts _(admin only)_
- [x] Registered users sub-page is accessible and shows registration data
- [x] Active users sub-page shows activity metrics
- [x] At-risk users sub-page shows at-risk indicators
- [x] Time filter controls update the user analytics data

---

## Journey 18: Analytics Content — Courses & Programs (8 checkpoints) — `journeys/18-analytics-content.spec.ts`

**Source files:** `app/analytics/courses/page.tsx`, `app/analytics/courses/[courseId]/page.tsx`, `app/analytics/programs/page.tsx`, `app/analytics/programs/[programId]/page.tsx`

- [x] Courses analytics page (/analytics/courses) loads with course metrics and list _(admin only)_
- [x] Course metrics display enrollment counts, completion rates, and engagement data
- [x] Clicking a course navigates to the course detail analytics page
- [x] Course detail page shows granular analytics for the selected course
- [x] Programs analytics page (/analytics/programs) loads with program metrics and list
- [x] Clicking a program navigates to the program detail analytics page
- [x] Program detail page shows program-level analytics and course breakdowns
- [x] Time filter controls update data on both courses and programs analytics pages

---

## Journey 19: Analytics Topics, Transcripts & Financial (6 checkpoints) — `journeys/19-analytics-topics-transcripts-financial.spec.ts`

**Source files:** `app/analytics/topics/page.tsx`, `app/analytics/transcripts/page.tsx`, `app/analytics/financial/page.tsx`

- [x] Topics analytics page (/analytics/topics) loads with topic cards and charts _(admin only)_
- [x] Topics page displays skill/topic distribution and engagement data
- [x] Transcripts analytics page (/analytics/transcripts) loads with transcript metrics
- [x] Transcripts page shows average message length, AI costs, and rating data
- [x] Financial analytics page (/analytics/financial) loads with cost cards and provider charts
- [x] Financial page displays cost breakdowns per day, by provider, and per user

---

## Journey 20: Analytics Reports (15 checkpoints) — `journeys/20-analytics-reports.spec.ts`

**Source files:** `app/analytics/reports/page.tsx`, `app/reports/[tenantKey]/[reportName]/page.tsx`

- [x] Navigate to Data Reports tab from the Analytics page _(admin only)_
- [x] All report cards (User Report, User Metadata, Chat History) display with download buttons
- [x] CSV editor dialog opens when clicking download on the User Report
- [x] CSV data is displayed in an editable table format with headers and rows
- [x] Cell values can be edited in the CSV editor
- [x] New row can be added via the Add Row button
- [x] Edited CSV saves successfully and triggers a file download
- [x] CSV editor closes without saving when Cancel is clicked
- [x] CSV editor closes when clicking Close button
- [x] CSV editor has proper ARIA labels and roles (dialog, table, buttons)
- [x] CSV editor opens for User Metadata Report with company column
- [x] Chat History report downloads directly without opening the CSV editor
- [x] Combined recommendation report cards have proper data-testids _(feature-gated)_
- [x] Combining reports dialog appears and can be cancelled _(feature-gated)_
- [x] Report download page shows preparing → complete phases and Back Home button

---

## Journey 21: Search (5 checkpoints) — `journeys/21-search.spec.ts`

**Source files:** `app/discover/page.tsx`, `components/nav-bar.tsx`

- [x] Global search input is accessible from the NavBar
- [x] Typing a query in global search displays results or navigates to the discover page
- [x] Search results show course cards matching the query
- [x] Clearing the search input resets results
- [x] Search works from the discover page's dedicated search input

---

## Journey 22: Navigation — NavBar & Sidebar (9 checkpoints) — `journeys/22-navigation-navbar.spec.ts`

**Source files:** `components/nav-bar.tsx`, `components/app-sidebar/index.tsx`, `components/header/profile/user-profile-button.tsx`

- [x] NavBar (PlatformNavbar shell) renders with Search, Notifications, and User Profile elements
- [x] Sidebar "Home" item navigates to /home
- [x] Profile is reachable from the user profile dropdown
- [x] Suggested Courses "See More" navigates to /recommended
- [x] Sidebar "Discover" item navigates to /discover
- [x] Sidebar "Analytics" menu navigates to /analytics _(admin only — skips for non-admin)_
- [x] User profile dropdown opens with Profile link, tenant selector, and logout option
- [x] Sidebar logo navigates to the home page
- [x] Course switcher in the navbar shows the current course and switches to another enrolled course

---

## Journey 23: Edit Profile Dialog (8 checkpoints) — `journeys/23-edit-profile-dialog.spec.ts`

**Source files:** `components/edit-profile-dialog.tsx`

- [x] Edit Profile dialog opens from the profile dropdown or profile page
- [x] Basic tab displays editable fields: Full Name, Email (read-only), Title, About
- [x] Social tab shows social media URL fields
- [x] Education tab has "Add Education" button that opens a sub-dialog with required fields
- [x] "I currently study here" toggle disables the end date field
- [x] Experience tab has "Add Experience" button that opens a sub-dialog
- [x] "I currently work here" toggle disables the end date field
- [x] Changes can be saved via "Save Changes" button; dialog can be closed via Cancel/Close

---

## Journey 24: Mobile View (7 checkpoints) — `journeys/24-mobile-view.spec.ts`

**Source files:** `components/app-sidebar/index.tsx`, `components/nav-bar.tsx`, `app/home/page.tsx`

- [x] Sidebar mobile sheet opens via the navbar hamburger and displays menu items on mobile viewport (375×812)
- [x] Course nav tabs container is horizontally scrollable on mobile (overflow-x-auto, w-full)
- [x] EdX iframe container has course-edx-iframe-container class and correct active-tab class per tab
- [x] Mobile viewport: non-course tabs (Progress, Dates, Discussion) have no padding on iframe container
- [x] Mobile viewport: Course tab retains padding on iframe container
- [x] Desktop viewport: all tab containers retain padding
- [x] Key pages (Home, Discover, Profile) render correctly on mobile without overflow

---

## Journey 25: Chat Embed — Mentor Widget (6 checkpoints) — `journeys/25-chat-embed.spec.ts`

**Source files:** `components/chat-button.tsx`, `components/chat/index.tsx`

- [x] "Open chat assistant" button is visible on pages that support the embed mentor widget
- [x] Clicking the chat button opens the embedded chat panel
- [x] User can type a message in the chat input and send it
- [x] Chat receives an AI response from the embedded mentor
- [x] Chat panel can be closed
- [x] Display Mentor AI checkbox in profile controls the visibility of the chat button

---

## Journey 26: Error Pages (4 checkpoints) — `journeys/26-error-pages.spec.ts`

**Source files:** `app/error/[code]/page.tsx`, `app/not-found.tsx`

- [x] Navigating to /error/404 displays a "Page Not Found" error page
- [x] Navigating to /error/403 displays a "Forbidden" error page
- [x] Navigating to a non-existent route displays the 404 not-found page
- [x] Error pages include a link or button to navigate back to Home

---

## Journey 27: UI Render Console Errors (3 checkpoints) — `journeys/27-ui-render-console-errors.spec.ts`

**Source files:** `app/home/page.tsx`, `app/discover/page.tsx`, `app/profile/page.tsx`

- [x] Authenticated user navigates to /home and sees no render failures or unignored console errors
- [x] Authenticated user navigates to /discover and sees no render failures or unignored console errors
- [x] Authenticated user navigates to /profile and sees no render failures or unignored console errors

---

## Journey 28: Tenant Management & Invitations (8 checkpoints) — `journeys/28-tenant-management-invitations.spec.ts`

**Source files:** `components/account-dialog.tsx`, `components/account-button.tsx`

- [x] Admin can open the tenant/account dialog from the profile dropdown _(admin only)_
- [x] Management tab displays "Invite" button for admin users
- [x] Admin can open the Invite Users modal and send an invite via email
- [x] Invite modal Courses tab has searchable user and course selection fields
- [x] Invite modal Programs tab has a searchable program selection
- [x] Provider Configuration card is visible in Advanced Settings with expand/collapse and table display _(admin only)_
- [x] External Credential Mapping card is visible with expand/collapse and add dialog _(admin only)_
- [x] Provider Configuration add dialog has required fields and Cancel closes it _(admin only)_

---

## Journey 29: Accessibility — WCAG 2.1 AA (10 checkpoints) — `journeys/29-accessibility-wcag.spec.ts`

**Source files:** `app/home/page.tsx`, `app/discover/page.tsx`, `app/profile/page.tsx`, `app/analytics/page.tsx`, `components/program-detail-modal.tsx`

- [x] Home page has no critical accessibility violations (axe-core scan)
- [x] Discover page has no critical accessibility violations
- [x] Profile page has no critical accessibility violations
- [x] Course about page has no critical accessibility violations
- [x] Analytics overview page has no critical accessibility violations _(admin only)_
- [x] Edit Profile dialog has proper ARIA attributes (tablist, tabpanel, aria-selected, aria-controls)
- [x] Program detail modal has proper dialog role and keyboard navigation
- [x] Notification dropdown has proper ARIA attributes
- [x] All major interactive elements have accessible names
- [x] No images without alt text on key pages

---

## Journey 30: Course Access Guard — Cross-Tenant Redirect (4 checkpoints) — `journeys/30-course-access-guard-tenant-redirect.spec.ts`

**Source files:** `components/course-access-guard.tsx`, `utils/helpers.ts`

- [x] Renders course about page when `course.platform_key` matches the current tenant
- [x] Renders course about page when `course.platform_key === 'main'`
- [x] Empty metadata response surfaces `/error/404`
- [x] Renders course about page for a foreign `platform_key` (cross-tenant gating removed)

---

## Journey 32: Program Detail Page (10 checkpoints) — `journeys/32-program-detail-page.spec.ts`

**Source files:** `app/programs/[program_id]/page.tsx`, `app/profile/programs/page.tsx`, `components/discover-content-card.tsx`

- [x] Clicking a profile > programs card navigates to `/programs/[program_id]` and renders the page
- [x] Clicking a discover program card navigates to `/programs/[program_id]` and renders the page
- [x] Program name heading and card image are visible on the detail page
- [x] Admin users see About, Courses, and Settings tabs with About selected by default _(admin only)_
- [x] Tab switching About → Courses → Settings updates `aria-selected` and tab content _(admin only)_
- [x] Settings tab renders Basic Information, Pricing & Dates, Visibility & Access, Images, Social & Promotion sections plus Save button _(admin only)_
- [x] Non-admin / non-tenant view renders the program courses list (or empty state) directly without tabs
- [x] Clicking a course card on the program page navigates to `/courses/[course_id]`
- [x] CTA button shows "Enroll Now" or "Purchase Now" for non-enrolled or paywalled users _(state-dependent)_
- [x] Direct navigation to `/programs/[program_id]` renders the page

---

## Journey 33: Analytics Audit (3 checkpoints) — `journeys/33-analytics-audit.spec.ts`

**Source files:** `app/analytics/audit/page.tsx`, `app/platform/[tenant]/analytics/audit/page.tsx`

- [x] Audit tab routes to /analytics/audit and the audit log view renders _(admin only)_
- [x] Audit log filters (user search, action filter) are visible
- [x] Audit log table (USER/ACTION/TIME) or empty state is visible

---

> **Note:** `auth.setup.ts` runs before all journeys to set up authentication. It is not a user journey.
