## [0.10.4]

- fix: iframe loading twice 30s after initial course page load

## [0.10.3]

- feat: course outline > have progress checks per unit instead of current icon

## [0.10.2]

- use legacy lms everywhere lms urls are required

## [0.10.1]

- chore(iblai-js): bump iblai-js to 1.1.1

## [0.10.0]

- chore(iblai-js): bump iblai-js to 1.1.0
- unified domain implementation with while keeping legacy lms url for iframing

## [0.9.14]

- iblai-js version updated

## [0.9.13]

- fix: lms css updated

## [0.9.12]

- fix: accessing course in an unauthorized way from another tenant restricted
- feat: proper error page implemented

## [0.9.11]

- fix: mfe, lms css for course content updated
- fix: error page included on skills
- feat: included NEXT_PUBLIC_SUPPORT_EMAIL env variable for default support email
- fix: user avatar bug mixing gravatar initials

## [0.9.10]

- fix: course pagination should only open on course tab

## [0.9.9]

- feat: course content page UI display optimized

## [0.9.8]

- fix: course payment flow payload updated

## [0.9.7]

- feat: reports page using AnalyticsReportDownload implemented
- fix: usermetadata endpoint skipped when username not available
- fix: credential creation issue fixed
- feat: prepush and check test coverage script added
- feat: suppressing cannot find module despite being exported from iblai-js & typecheck issues fixed
- feat: typechecks issues fixed added
- fix: conflicting css RE to sdk on skills resolved

## [0.9.6]

- iblai-js version bumped to 1.0.26
- build issue fixed

## [0.9.5]

- feat: analytics course program update
- fix: sdk css imported into spa

## [0.9.4]

- fix(skills): add sso-login-complete to non-auth pages
- fix(web-utils): TenantProvider loading state fixes and tenant switch control flow improvements

## [0.9.3]

- fix(auth): prevent redirect loops and properly handle redirect-path across SPAs
- fix(auth): skip Authorization header on password reset endpoint
- fix(skills): add onAuthFailure handler to TenantProvider for custom domain access errors

## [0.9.2]

- fix(skills): access course button background issue

## [0.9.1]

- fix(skills): course outline display issue fixed
- feat(web-containers): analytics > transcript > sesson_id passed to query param to load transcript https://github.com/iblai/iblai-platform/issues/201
- feat(skills): course advanced settings feature implemented
- feat(skills): program metadata settings implemented
- Feat/web containers/notification human support template
- feat(web-containers): combining recommendation reports now works with metadata instead of env flags https://github.com/iblai/ibl-web-frontend/issues/1402
- fix(web-containers): analytics > different dates display issue fixed
- feat(web-containers): data reports > polling mechanism optimized to reduce calls
- feat(web-containers): data reports > csv deletion improved to show row fading out
- Feat/web containers/profile dropdown truncate to allow one line

## [0.9.0]

- Add sso-login-complete path to replace sso-login for completing sso

## [0.8.9]

- fix(skills): fix wrong redirect issue to login.iblai.app

## [0.8.8]

- feat(web-containers): help center switch feature implemented #1476
- feat(web-containers): catalog invite content list with scroll pagination #1332
- fix(skills): recommended courses images not displaying fixed #1449
- feat(web-containers): recommendation related reports can now be combined when env flag enabled #1402
- fix(skills): discover page pagination issue with programs contents fixed
- feat(web-containers): add source code editor mode to html editor feature
- feat(web-containers):resets edit template dialog form fields on close

## [0.8.7]

- force runtime node in dockerfile to 25.3.0

## [0.8.6]

- force node 25.3.0 use to fix ALS vulnerability

## [0.8.5]

- fix(skills): credentials sdk endpoints broken and now manually constructed

## [0.8.4]

- chore(web-containers): complete team sharing functionality
- fix(web-containers): fix notification template title form issue
- fix(skills): configuration > credential type issue fixed
- feat(skills): program image issue completely fixed
- feat(web-containers): external mapping and provider configuration feature implemented

## [0.8.3]

- feat(web-containers): management > roles, policy, group pagination implemented
- feat(web-containers): management > roles, policy, group, roles search bar UI unified
- feat(web-containers): management > roles, policy, group search now endpoint based
- feat(web-containers): extra columns to csv invite uploads
- fix(web-containers): user management search tab not working on non-page 1 fixed + loader added
- Fix for https://github.com/iblai/ibl-web-frontend/issues/1095
- https://github.com/iblai/ibl-web-frontend/issues/1332 fixed
- feat(web-containers): policy notification template feature implemented
- refactored overall notification Edit dialog component into sub_components
- feat(web-containers): rich text editor improved to handle complex HTML

## [0.8.2]

- fix: https://github.com/iblai/ibl-web-frontend/issues/1299
- fix: https://github.com/iblai/ibl-web-frontend/issues/1300

## [0.8.1]

- feat(web-containers): advanced tenant css implemented under advanced settings
- fix(mentor): web containers > auto open alert tab when admin and no notifications
- fix(skills): overall endpoint calls improvement by prefering cache values

## [0.8.0]

- Platform level rbac implementations and customizations

## [0.7.8]

- refactor mentor, auth. allow them to skip for sso login and version urls

## [0.7.7]

- fix(skills): enrolled courses should only display current tenant courses

## [0.7.6]

- fix: issue where failing images weren't hidden on initial load or reload when on the About tab. Changes

## [0.7.5]

- feat(playwright): profile component properly covered with playwright
- feat(web-containers): profile component now better optimized accessibility wise
- feat(skills): learning info and instructor tabs added to course about page
- Added sendJWTTokenToIframe() function that reads JWT token from localStorage
- Extracts iframe origin from URL for secure postMessage targeting
- Sends JWT token via postMessage when iframe loads
- Handles errors gracefully (invalid URLs, missing refs, missing tokens)

## [0.7.4]

- feat(skills): send JWT token to MFE iframes via postMessage for authentication
- feat(skills): EdxIframe component now automatically sends edx_jwt_token from localStorage to Learning and Discussions MFEs when iframe loads
- chore: bump nextjs version to 15.3.6

## [0.7.3]

- fix(web-containers): non focusable search fields on catalog invite feature due to popover fixed
- fix(playwright): existing mentor tests suites related to invite made shared feature
- fix(playwright): playwright tests for whole invitation feature on skills implemented

## [0.7.2]

- fix(skills): sba onboarding issues fixed Skills | SBA Onboarding requested feature #1152
- fix(skills): meta title now from server side
- feat(web-containers-auth): footer credit implemented

## [0.7.1]

- feat(web-containers): added display_slide_panel_logo & authorize_only_password_login fields to Authentication customization setting
- fix(skills): mentorAI not found issue fix

## [0.7.0]

- feat(web-container): proactive learner notification integration

## [0.6.12]

- feat(web-containers): replace s3 url from auth customization images field with new file proxy url endpoint

## [0.6.11]

- chore: bump skills version to 0.6.10

## [0.6.10]

- chore: add mentor id to the mentor object metadata
- chore(web-utils): mentor provider select default mentor from meta data

## [0.6.9]

- fix(skills): hide sidebar mentor button when no mentors found

## [0.6.8]

- chore(web-utils): check for empty array string for tenant before triggering refresh

## [0.6.7]

- chore(web-utils): updates redirectToAuthSpa to accept argument for saving redirect

## [0.6.6]

- fix(web-utils): looping call to get public settings for mentor due to call to determine auth before applying cookie sync check
- optimize usage of tenant provider in providers to also depend on the custom domain to select tenant

## [0.6.5]

- chore(web-utils): auth provider updates to ensure tenant switching clears syncing cookies

## [0.6.4]

- feat(skills): instructor feature updated to fetch edxSSoAuthToken

## [0.6.3]

- use auth provider properly, pass storageservice object to it
- add /version as publicly accessible

## [0.6.2]

- feat(web-containers): rbac management feature updated
- feat(skills): instructor tab implemented

## [0.6.1]

- fix(auth): add storageService prop to AuthProvider for cross-SPA synchronization

## [0.6.0]

- feat(auth): implement cross-SPA logout synchronization via cookies
- Add logout timestamp cookie in `handleLogout` function to trigger logout across all SPAs
- Automatically trigger logout across all SPAs when any app initiates logout
- Migrate SSO login to reusable component from web-containers package

## [0.5.7]

- feat(web-containers): rbac management feature implemented

## [0.5.6]

- feat(web-containers): auth spa customization upload endpoint integrated

## [0.5.5]

- feat(web-containers): auth spa customization implemented

## [0.5.4]

- feat(web-containers): non mentor recommendation_type converted to catalog on payloads
- feat(web-containers): platformOrg payload added to use recommended courses endpoint
- feat(web-containers): recommendation > typecheck issues fixed

## [0.5.3]

- feat(web-containers): Implement notification v1 feature as a common component
- feat(skills): Integrated notification feature on skills
- feat(web-containers): RichTextEditor replaces existing wysiwygEditor
- feat(web-containers): Alert template feature implemented

## [0.5.2]

- feat(skills): added include_main_catalog payload to useRecommended hook

## [0.5.1]

- feat(web-containers): recommended prompts feature integrated
- feat(skills): recommended feature search endpoint integration on progress

## [0.5.0]

- fix(web-containers): analytics > topics > when rating empty display conversation graph
- fix(web-containers): profile > consistency labels issue fixed
- fix(web-containers): invite > community course flag deactivated from catalog list
- fix(web-containers): analytics > topics > playwright tests updated

## [0.4.9]

- feat(web-containers): course & program catalog invite implemented

## [0.4.8]

- fix(web-containers): analytics > topics > conversation y-axis shouldn't be decimal
- fix(web-containers): analytics > optimize axis charts
- fix(web-containers): analytics > transcript > unify conversation transcript titles
- fix(web-containers): analytics > transcript > loader added on search & label unification
- fix(web-containers): patched analytics > data reports download not to use window.open
- feat(web-containers): csv uplaod editor implemented
- feat(web-containers): csv uplaod editor integrated on invite user feature

## [0.4.7]

- [#767](https://github.com/iblai/ibl-web-frontend/issues/767) - Start Screen Feature Flag implemented

## [0.4.6]

- feat(web-containers): custom dns now has a verification feature for domains

## [0.4.5]

- [#660](https://github.com/iblai/ibl-web-frontend/issues/660) - Extend Profile Component by including Education, Experience, Resume tabs

## [0.4.4]

- feat(web-containers): Analytics > Data Reports feature implemented

## [0.4.3]

- [#619](https://github.com/iblai/ibl-web-frontend/issues/619) - Update display on the sidebar mentor handling mentor_hidden flag feature

## [0.4.2]

- [#594](https://github.com/iblai/ibl-web-frontend/issues/594) - integrated Analytics component from web-containers
- Fixed Transcript page mobile display issue

## [0.4.1]

- [#619](https://github.com/iblai/ibl-web-frontend/issues/619) - Display on the sidebar mentor, the mentor ID on the course metadata

## [0.4.0]

- [#496](https://github.com/iblai/ibl-web-frontend/issues/496) - Public Registration Join Link updated
- [#590](https://github.com/iblai/ibl-web-frontend/issues/590) - Implement course payment feature for student

## [0.3.10]

- [#486](https://github.com/iblai/ibl-web-frontend/issues/486) - Implement Exam Proctoring Feature

## [0.3.9]

- [#486](https://github.com/iblai/ibl-web-frontend/issues/486) - Implement Exam Proctoring Feature

## [0.3.8]

- [#486](https://github.com/iblai/ibl-web-frontend/issues/486) - Implement Exam Proctoring Feature

## [0.3.7]

- [#475](https://github.com/iblai/ibl-web-frontend/issues/475) - Show tenant key at first before Organization name fetch from endpoint & should be cached & invalidated upon mutation

## [0.3.6]

- Adds allow="microphone _; camera _; midi _; geolocation _; encrypted-media \*" to edx iframe

## [0.3.5]

- [#379](https://github.com/iblai/ibl-web-frontend/issues/379) - Fix inconsistent spacing issues on overall header nav bar

## [0.3.4]

- [#379](https://github.com/iblai/ibl-web-frontend/issues/379) - Fix inconsistent spacing issues on overall header nav bar

## [0.3.3]

- [#343](https://github.com/iblai/ibl-web-frontend/issues/343) - Catalog Invite should use Community Courses tenant metadata flag

## [0.3.2]

- [#334](https://github.com/iblai/ibl-web-frontend/issues/334) - Extend Invite feature to incorporate bulk upload + Catalog Invite

## [0.3.1]

- [#327](https://github.com/iblai/ibl-web-frontend/issues/327) :
- Certificate no longer displayed under course about page
- Proper spacing on the filter section on Discover page
- Community Courses metadata added and when enabled, main can be used on display of recommeded, discover & enrolled courses
- Account component > Management : Status column added allowing to dissociate user from platform
- Invite Feature > Inactive status updated to Accepted

## [0.3.0]

- [#307](https://github.com/iblai/ibl-web-frontend/issues/307) - Remove weird top margin on Skills display of Account component inner layout

## [0.2.9]

- [#284](https://github.com/iblai/ibl-web-frontend/issues/284) - Updating Advanced tab component

## [0.2.8]

- [#287](https://github.com/iblai/ibl-web-frontend/issues/287) - Have a none option for default mentor dropdown + Miscelleanous updates

## [0.2.7]

- [#281](https://github.com/iblai/ibl-web-frontend/issues/281) - Nan:Nan bug fixed at duration display on course about page
- [#285](https://github.com/iblai/ibl-web-frontend/issues/285) - Handle course Progress bar stuck a 0% and not being populated
- [#284](https://github.com/iblai/ibl-web-frontend/issues/284) - Have an Advanced tab on the Account component handling metadatas for each SPA
- [#287](https://github.com/iblai/ibl-web-frontend/issues/287) - Apply set mentor on Account component > Advanced tab to be used as embedded mentor or fallback to mentorAI mentor

## [0.2.6]

- [#269](https://github.com/iblai/ibl-web-frontend/issues/269) - Implement version page for Skills SPA

## [0.2.5]

- [#267](https://github.com/iblai/ibl-web-frontend/issues/267) - Have new notifications UI as common component

## [0.2.4]

- [#254](https://github.com/iblai/ibl-web-frontend/issues/254) - Optimize Profile dropdown component fixing profile image on upload not showing up on the profile dropdown trigger

## [0.2.3]

- [#262](https://github.com/iblai/ibl-web-frontend/issues/262) - Fix duplicate close button on embedded sidebar mentor
- [#262](https://github.com/iblai/ibl-web-frontend/issues/262) - Post Message API interaction on close button
- [#262](https://github.com/iblai/ibl-web-frontend/issues/262) - Public Profile Edit button not working fixed
- [#262](https://github.com/iblai/ibl-web-frontend/issues/262) - Consistency issue fixed

## [0.2.2]

- [#258](https://github.com/iblai/ibl-web-frontend/pull/258) - Updated usage of banner_image_asset_path to course_image_asset_path
- [#258](https://github.com/iblai/ibl-web-frontend/pull/258) - Fixed wrong usage of dm URL instead of LMS

## [0.2.1]

- [#246](https://github.com/iblai/ibl-web-frontend/issues/246) - Fix credentialsCustomApiSlice not in skills reducer
- UI consistency issue regarding Admin/student pill under Profile component fixed

## [0.2.0]

- [#258](https://github.com/iblai/ibl-web-frontend/issues/258) - Use course_image_asset_path instead of banner_image_asset_path when loading courses images

## [0.1.32]

- [#246](https://github.com/iblai/ibl-web-frontend/issues/246) - Now using the Integration & credentials endpoints for Schema & LLMs

## [0.1.31]

- [#254](https://github.com/iblai/ibl-web-frontend/issues/254) - User Profile dropdown now a common component, in use, replacing old Profile dropdown component

## [0.1.30]

- [#251](https://github.com/iblai/ibl-web-frontend/issues/251) - Fix Profile > Pathways, Programs, Courses tab bug issue on click of active subtab
- [#249](https://github.com/iblai/ibl-web-frontend/issues/249) - Fix Repeated Navbar on course load

## [0.1.29]

- [#221] - Buggy UI display issues fixed

## [0.1.28]

- [#207](https://github.com/iblai/ibl-web-frontend/issues/207) Skill title renamed to skillsAI

## [0.1.27]

- [#197](https://github.com/iblai/ibl-web-frontend/issues/197) - Fix Start Page navigation blocking issue when Roles & SKills empty

## [0.1.26]

- [#178](https://github.com/iblai/ibl-web-frontend/issues/178) - Update Tenant Switching Component Props

## [0.1.25]

- [#153](https://github.com/iblai/ibl-web-frontend/issues/153) - Resume tab correctly hidden on public profile when SkillsResumeFeatureIsHidden from tenant metadata

## [0.1.24]

- [#153](https://github.com/iblai/ibl-web-frontend/issues/153) - Tenant metadata feature enabling/disabling regarding Hiding assignments feature on profile: courses, pathways, programs & hiding resumes in /start and on profile + Toggling mentorAI sidebar + Leaderboard with tenant metadata and user metadata

## [0.1.23]

- [#168](https://github.com/iblai/ibl-web-frontend/issues/168) - Discover page courses throwing error page
- [#169](https://github.com/iblai/ibl-web-frontend/issues/169) - Integrating Resources on pathway cration + Reading resources on pathway detail modal
- [#171](https://github.com/iblai/ibl-web-frontend/issues/171) - Suggested courses on homepage and recommended courses tab need to be tenant specific

## [0.1.22]

- [#157](https://github.com/iblai/ibl-web-frontend/issues/157) - Profile tab & Discover page are showing skills from other tenants fixed

## [0.1.21]

- [#150](https://github.com/iblai/ibl-web-frontend/issues/150) - Profile > Pathways : Pathway Creation content list should use tenant based content
- [#151](https://github.com/iblai/ibl-web-frontend/issues/151) - Profile | Progress bar on profile pathways, programs
- [#152](https://github.com/iblai/ibl-web-frontend/issues/152) - Profile | Add Enroll button on Pathways & Programs
- Misceallenous updates

## [0.1.20]

- [#140](https://github.com/iblai/ibl-web-frontend/issues/140) - Profile > Skills : Horizontal scrolling using Next/Previous buttons on Reported/Desired skills
- [#141](https://github.com/iblai/ibl-web-frontend/issues/141) - Mentor on uncollapse shouldn't float on page content but appear as sidebar fixed
- [#142](https://github.com/iblai/ibl-web-frontend/issues/142) - Header Logo Not Matching What's Been Set in Analytics or DM fixed
- [#143](https://github.com/iblai/ibl-web-frontend/issues/143) - Profile | Courses Tab missing pagination fixed
- [#145](https://github.com/iblai/ibl-web-frontend/issues/145) - Public Profile Media resume issue fixed
- [#146](https://github.com/iblai/ibl-web-frontend/issues/146) - Catalog | Programs issue fixed
- Zoom on input focus on mobile fixed
- Misceallenous updates

## [0.1.19]

- [#136](https://github.com/iblai/ibl-web-frontend/issues/136) - Skills Vercel | Profile Tabs | Issues fixed

## [0.1.18]

- Discover page responsiveness integrated
- Course detail page responsiveness integrated
- Next / Previous course navigation integrated

## [0.1.17]

- Enable Mentor flag label updated
- Package version to 0.1.17

## [0.1.16]

- Overall Responsiveness issue fixed. Remains course content page responsiveness
- Package version to 0.1.16
- Changelog file added
