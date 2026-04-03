<p align="center">
  <img src="public/iblai-logo.png" alt="skillsAI" width="80" />
</p>

<h1 align="center">skillsAI</h1>

<p align="center">
  <strong>Open-source skills intelligence platform — discover courses, track competencies, earn credentials, and accelerate workforce development.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#deployment">Deployment</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#configuration">Configuration</a> &bull;
  <a href="#contributing">Contributing</a> &bull;
  <a href="#license">License</a>
</p>

---

## What is skillsAI?

skillsAI is a production-ready learning and skills management platform that connects learners with courses, tracks competency growth, issues credentials, and delivers actionable analytics. It ships as a modern web application backed by a powerful multi-tenant API with integrated LMS and AI mentor capabilities.

Whether you're an enterprise building an internal upskilling program, a university offering online courses, or an EdTech startup creating a branded learning marketplace — skillsAI gives you the complete stack out of the box.

---

## Features

### Course Discovery & Enrollment

- **Faceted search** — filter courses by subject, difficulty, skills, credential type, and content type
- **Personalized recommendations** — AI-powered course suggestions based on learner profile and goals
- **Course detail pages** — rich metadata with syllabus, learning outcomes, instructor bios, and prerequisites
- **Flexible enrollment** — self-enrollment, invitation-only, and Stripe-powered paid courses
- **EdX LMS integration** — embedded course content, progress tracking, and grading via iframe

### Skills & Competency Tracking

- **Skill inventory** — track earned skills with proficiency levels (0–5 scale)
- **Skill points** — accumulate points from course and unit completions
- **Skill leaderboards** — compare mastery across learners and cohorts
- **Self-reported skills** — onboarding flow for learners to declare existing competencies
- **Skills-to-course mapping** — see which courses develop which skills

### Credentials & Badges

- **Digital credentials** — earn and display certificates, badges, and micro-credentials
- **Credential verification** — issuer metadata, expiration tracking, and sharing
- **Course-linked credentials** — automatic credential issuance on course completion

### Programs & Learning Pathways

- **Multi-course programs** — structured program enrollments with progress tracking
- **Curated pathways** — guided learning sequences toward specific career goals
- **Program management** — pricing, enrollment windows, and custom metadata
- **Pathway creation** — build and share custom pathways for teams or organizations

### Learner Profile & Analytics

- **Activity dashboard** — courses enrolled, courses completed, skills acquired, time spent
- **Time-spent charts** — daily/weekly learning activity visualization
- **Public profile** — shareable learner profile with education, experience, and credentials
- **Resume builder** — education history, work experience, and portfolio links

### Analytics (Admin)

- **Overview dashboard** — platform-wide usage stats and engagement metrics
- **User analytics** — per-learner activity and cohort trends
- **Topic analysis** — most popular subjects and content breakdowns
- **Transcript viewer** — searchable session and activity logs
- **Financial reporting** — revenue tracking and billing analytics
- **Custom reports** — generate and download data exports

### Enterprise & Platform

- **Multi-tenancy** — full tenant isolation with per-org configuration, branding, and user management
- **Role-based access control (RBAC)** — granular permissions with roles, policies, and group-based access
- **SSO authentication** — Single Sign-On with configurable identity providers
- **Stripe billing** — paid courses, subscription management, and checkout flows
- **Notifications** — in-app notification system with alert templates
- **White-labeling** — custom themes, logos, and advanced CSS per tenant
- **AI mentor sidebar** — embedded conversational AI assistant for learner support
- **Configurable onboarding** — skill self-assessment and profile setup flows

---

## Tech Stack

| Layer     | Technology                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 15, React 19, TypeScript                                                                                 |
| Styling   | Tailwind CSS 3, Radix UI, shadcn/ui                                                                              |
| State     | Redux Toolkit, React-Redux                                                                                       |
| Forms     | React Hook Form, TanStack Form, Zod                                                                              |
| Charts    | Recharts                                                                                                         |
| Animation | Framer Motion                                                                                                    |
| PDF       | react-pdf, pdfjs-dist                                                                                            |
| Testing   | Vitest, Testing Library                                                                                          |
| SDK       | [@iblai/iblai-js](https://www.npmjs.com/package/@iblai/iblai-js) — unified data layer, components, and utilities |

---

## Quick Start

### Prerequisites

- **Node.js 25.3.0+** (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm 10+** — `npm install -g pnpm`

### 1. Clone the repository

```bash
git clone https://github.com/iblai/skills-ai.git
cd skills-ai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your IBL.ai platform credentials:

```env
# Required — your IBL.ai platform URLs
NEXT_PUBLIC_AUTH_URL=https://auth.your-domain.com
NEXT_PUBLIC_LMS_URL=https://learn.your-domain.com
NEXT_PUBLIC_DM_URL=https://base.manager.your-domain.com
NEXT_PUBLIC_AXD_URL=https://base.manager.your-domain.com

# Required — your tenant key
NEXT_PUBLIC_MAIN_TENANT_KEY=main

# App URLs
NEXT_PUBLIC_SKILLS_URL=http://localhost:3000

# Feature flags
NEXT_PUBLIC_IBL_PLATFORM=skills
NEXT_PUBLIC_STRIPE_ENABLED=false
NEXT_PUBLIC_ENABLE_START_ROLE=true
NEXT_PUBLIC_ENABLE_MENTOR=true
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Node.js 25+ note:** The `dev` script already includes `--no-experimental-webstorage` to prevent conflicts with the SDK's browser storage guards. If you customize your scripts, make sure to include `NODE_OPTIONS='--no-experimental-webstorage'`.

---

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t skills-ai .
docker run -p 3000:3000 --env-file .env.local skills-ai
```

### Standalone

```bash
pnpm build
pnpm start
```

The build generates a Next.js production bundle. Deploy to any server with Node.js 25+ installed, or use platforms like Vercel, Railway, or Render.

---

## Architecture

```
skills-ai/
├── app/                        # Next.js App Router
│   ├── home/                   # Learner dashboard
│   ├── discover/               # Course discovery & search
│   ├── recommended/            # Personalized recommendations
│   ├── courses/[course_id]/    # Course details & enrollment
│   ├── course-content/         # EdX LMS integration (iframe)
│   │   └── [course_id]/        # Course, progress, bookmarks, forums
│   ├── profile/                # Learner profile
│   │   ├── skills/             # Skills inventory
│   │   ├── credentials/        # Earned credentials
│   │   ├── courses/            # Enrollment history
│   │   ├── programs/           # Program enrollments
│   │   ├── pathways/           # Learning pathways
│   │   └── public/             # Shareable profile
│   ├── analytics/              # Admin analytics (5 sub-pages)
│   ├── notifications/          # Notification center
│   ├── start/                  # Onboarding flow
│   ├── sso-login/              # SSO authentication
│   └── version/                # App version info
│
├── components/                 # React components
│   ├── ui/                     # 50+ shadcn/ui primitives
│   ├── profile/                # Profile cards (education, experience, skills)
│   ├── edx-iframe/             # LMS content embedding
│   ├── onboarding/             # Setup wizard slides
│   ├── header/                 # Navigation & user profile
│   └── ...                     # Feature components
│
├── hooks/                      # Custom React hooks
│   ├── courses/                # Course data, enrollment, navigation
│   ├── profile/                # Profile stats, time spent, pathways
│   ├── skills/                 # Skill tracking & reporting
│   ├── discover/               # Search & filtering
│   ├── search/                 # Catalog search & personalization
│   └── ...
│
├── features/                   # Feature modules (state + logic)
│   └── rbac/                   # Role-based access control
│
├── services/                   # API service definitions
├── types/                      # TypeScript interfaces
├── config/                     # Runtime configuration
├── providers/                  # React context providers
├── lib/                        # Utilities
├── styles/                     # Global CSS
└── public/                     # Static assets
```

### Data Flow

```
User → React Components → Custom Hooks → Redux (RTK Query) → IBL.ai API
                                              ↓
                                        @iblai/iblai-js SDK
                                        ├── /data-layer  (API slices, reducers)
                                        ├── /web-utils   (auth, providers, tenant hooks)
                                        └── /web-containers (shared UI components)
```

The app uses **[@iblai/iblai-js](https://www.npmjs.com/package/@iblai/iblai-js)** as its unified SDK, which bundles the data layer, authentication utilities, and shared components under a single package.

---

## Configuration

### Environment Variables

| Variable                                      | Required | Description                             |
| --------------------------------------------- | -------- | --------------------------------------- |
| `NEXT_PUBLIC_AUTH_URL`                        | Yes      | Authentication service URL              |
| `NEXT_PUBLIC_LMS_URL`                         | Yes      | LMS platform URL                        |
| `NEXT_PUBLIC_DM_URL`                          | Yes      | Platform manager URL                    |
| `NEXT_PUBLIC_AXD_URL`                         | Yes      | API data service URL                    |
| `NEXT_PUBLIC_MAIN_TENANT_KEY`                 | Yes      | Primary tenant identifier               |
| `NEXT_PUBLIC_SKILLS_URL`                      | Yes      | This app's public URL                   |
| `NEXT_PUBLIC_IBL_PLATFORM`                    | Yes      | Platform type (`skills`)                |
| `NEXT_PUBLIC_STRIPE_ENABLED`                  | No       | Enable Stripe billing (`true`/`false`)  |
| `NEXT_PUBLIC_ENABLE_START_ROLE`               | No       | Enable onboarding skill self-assessment |
| `NEXT_PUBLIC_ENABLE_MENTOR`                   | No       | Enable embedded AI mentor sidebar       |
| `NEXT_PUBLIC_ENABLE_RBAC`                     | No       | Enable role-based access control        |
| `NEXT_PUBLIC_HIDE_RECOMMENDED_TAB`            | No       | Hide recommendations page               |
| `NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED`      | No       | Enable enrollment prerequisite checks   |
| `NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC`  | No       | Use Gravatar for profile pictures       |
| `NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE` | No       | Hide specific discovery filters         |
| `NEXT_PUBLIC_USE_FOOTER_MENUS`                | No       | Enable custom footer navigation         |

### Feature Flags

Feature flags are set via environment variables prefixed with `NEXT_PUBLIC_`. They control which features are visible and active in the application:

- **Stripe billing** — `NEXT_PUBLIC_STRIPE_ENABLED=true`
- **Onboarding flow** — `NEXT_PUBLIC_ENABLE_START_ROLE=true`
- **AI mentor** — `NEXT_PUBLIC_ENABLE_MENTOR=true`
- **RBAC** — `NEXT_PUBLIC_ENABLE_RBAC=true`
- **Skill leaderboard** — configured via tenant metadata (`isSkillsLeaderBoardEnabled`)

---

## Scripts

| Script           | Description                           |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Start development server (port 3000)  |
| `pnpm build`     | Production build                      |
| `pnpm start`     | Start production server               |
| `pnpm lint`      | Run ESLint with auto-fix + type check |
| `pnpm typecheck` | TypeScript type checking              |
| `pnpm format`    | Format code with Prettier             |
| `pnpm test`      | Run unit tests (Vitest)               |

---

## IBL.ai Platform

skillsAI is built on the [IBL.ai](https://ibl.ai) platform. To use this app, you need access to an IBL.ai backend instance which provides:

- **Skills & Course API** — course catalog, enrollment, progress tracking, and skill management
- **EdX LMS** — course content delivery, grading, and certificate issuance
- **Authentication** — SSO, OAuth, JWT-based auth with multi-tenant support
- **Data Platform** — analytics, billing, user management, and notification services
- **AI Mentor API** — conversational AI for learner support (optional)

Visit [ibl.ai](https://ibl.ai) to set up your backend or request a hosted instance.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

---

## License

ISC License. See [LICENSE](LICENSE) for details.
