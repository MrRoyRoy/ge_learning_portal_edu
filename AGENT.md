# Gemini Enterprise - Edu Portal Developer Guidelines (`AGENT.md`)

This document serves as the persistent single source of truth for the **Google Gemini Enterprise Education Adoption & Playbook Portal**. It outlines the technology stack, specific coding and terminology preferences, design guidelines, and the current implementation state.

---

## 1. Technology Stack & Architecture

The application is built as a high-fidelity, dynamic web application supported by a secure containerized Node.js backend.

* **Backend Server:** Node.js + Express framework (`server.js`) powering dynamic REST APIs, session storage, and database management.
* **Dual Database Layer:**
  * **Production (PostgreSQL):** Production-ready pool configuration (`pg`) optimized for container scaling on Google Cloud Run.
  * **Local/Offline Fallback (SQLite):** File-based SQLite (`edu_portal.db`) with automatic table structures creation.
* **VM Sandbox Seeding Module:** Securely parses and extracts 14 static scholastic/operational playbooks and translations from `app.js` on first boot inside an isolated Node `vm` context, eliminating seed duplication. Includes a 6-month historical log generator to populate visual analytics out-of-the-box.
* **Authentication Gateways:** Enforced via `express-session` cookies and `bcryptjs` hashing.
  * **Master Admin Account:** `edu_portal_s_admin` with password `***REMOVED***`.
  * **Admin Assist Account:** `edu_portal_admin` with password `***REMOVED***` (cannot Create, Update, or Delete use case playbooks).
  * **Demo Admin Account:** `demo-admin` with password `***REMOVED***` (inherits identical assistant admin rights and permissions as `edu_portal_admin`).
  * **Standard Accounts:** Email-based provisioning with auto-generated 10-character temp passwords. Force-reset of credentials is strictly enforced on first login.
* **Markup & Client Logic:** Vanilla HTML5 paired with modular ES6+ client-side logic (`app.js`). Hydrates page templates dynamically from `/api/use-cases` on session validation.
* **Styles & Visual Identity:** Pure Swiss Minimalism Vanilla CSS (`style.css`), powered by CSS variable maps. **TailwindCSS is strictly avoided** to preserve precise typographic scale and structural grids.

---


## 2. Terminology & Brand Boundaries

Strict guidelines govern how features, products, and connectors are named. These boundaries must be strictly observed in all UI elements and translations:

### Approved Terminology
* **Enterprise Title:** `Gemini Enterprise - Edu Portal` (Avoid *"Antigravity"* or general references).
* **Main Models & Features:** `NotebookLM` (Never refer to it as *"NotebookLM Enterprise"*), `Gemini`, `Canvas Mode`, `Deep Research`, `Agent Designer`, `Image Generation` (Never use *"Nano Image Gen"*), `Video Generation`.

### Forbidden Terminology
* **Never** use the term **"Gem"** (always use **"Agent"**).
* **Never** use the term **"Copilot"**.

### Localization Boundary
* Keep product and system names (*NotebookLM*, *Gemini*, *Canvas Mode*, *Deep Research*, *Agent Designer*, *Image Generation*, *Video Generation*) strictly in **English** within both Traditional Chinese (`zh-TW`) and Simplified Chinese (`zh-CN`) translations.

---

## 3. Design Aesthetics & Legibility Rules

The portal is designed with a premium, state-of-the-art aesthetic that shifts dynamically between light and dark modes:

* **Dark/Light Mode Theme Variable Management:**
  * Backgrounds, borders, and main cards are driven by CSS variables (e.g., `--bg-primary`, `--border-glass`).
  * Ggradient title elements (like `.welcome-msg`) use dynamic color variables (`var(--welcome-msg-start)` and `var(--welcome-msg-end)`) to prevent low-contrast text failures in light mode. In light mode, headings shift gracefully to elegant dark slate/steel colors rather than retaining light/white gradients.
* **Icon Softening:**
  * Utility icons inside side panels and secondary items use soft muted colors (`var(--text-muted)`) rather than stark black/white colors, ensuring a quiet, premium aesthetic that lights up elegantly on active hover states.
* **No Placeholders:**
  * Standard icons are rendered using the Google Material Symbols Outlined font library.
  * Overlapping UI buttons (such as the **Copy Prompt** button in the sandbox drawer) are properly padded to ensure clear separation and zero element overlapping.

---

## 4. Connector & Dynamic Variable Logic

The portal supports intelligent integration simulation and dynamic prompt customization:

* **Nomenclature:**
  * All connector components are named generically in user-facing toasts and badges to ensure product agnosticism (e.g., **Drive Connector**, **Email Connector**, **Calendar Connector**, **LMS Connector**) rather than referencing vendor-specific software.
* **Essential Connectors vs. Optional Connectors:**
  * Use cases that strictly require an active integration carry a `connectorEssential: true` tag and show a locked overlay when their corresponding connector is toggled off.
  * Use cases where integrations are secondary enhancements are tagged with `connectorEssential: false` and remain unlocked at all times.
* **Manual Workflow Tips Box (Replaced Dual-Mode Toggle):**
  * Rather than complex dual-prompt switches, playbook detail views feature a streamlined, clean prompt container accompanied by a non-intrusive manual tips box (`.manual-tip-box`) recommending the manual file upload fallback workflow if institutional connectors are inactive or unavailable.
* **Dynamic "Fill in the Variables" Engine:**
  * Prompts automatically scan for variable tokens (e.g. `[COURSE_NAME]`, `[ASSIGNMENT_TOPIC]`).
  * An interactive variable panel renders real-time input fields directly above the prompt.
  * Editing variable values dynamically interpolates into both the highlighted prompt preview and the instant clipboard copy action.
* **Collapsible Prompt (Default Closed):**
  * Step instructions display prompts inside a `<details class="prompt-collapsible">` container, collapsed by default to maintain a clean, compact view per modern prompt library standards.

---

## 5. Current Implementation State

The following dynamic authorization, session gating, and admin workflows are 100% verified, compiled, and operational:

```mermaid
graph TD
  A[Start / DOM Loaded] --> B{Fetch /api/auth/session}
  B -->|Not Logged In| C[Display Login Card Gate]
  C -->|Login Success| A
  B -->|Is Admin| D[Display Administration Portal]
  B -->|Is Standard User| E{isTemp Password?}
  E -->|True| F[Enforce Temp Reset Card]
  F -->|Reset Success| G[Display Profile Configuration Wizard]
  E -->|False| H{Has Context Profile?}
  H -->|No| G
  G -->|Submit Config| I[Load Server-Side Playbooks & Active Main App]
  H -->|Yes| I
  I --> J[Sync Likes & Deploys on Card Interaction]
```

* **Instant Translation Chain:** Language switches translate the full portal, sidebar filters, active user context metrics, and interactive toasts in real-time.
* **Product-Agnostic Notifications:** Simulating connectors issues clean native toasts, fully localized across English (`en`), Traditional Chinese (`zh-TW`), and Simplified Chinese (`zh-CN`).
* **Interactive Preferences (Likes/Deployments):** Standard use case cards carry responsive heart and rocket icons that bypass detail popups, updating preference tables dynamically on the server database.
* **SVG Vector Graph Charts:** The admin statistics view aggregates database events and paints high-contrast line charts showing Page Views, Likes, and Deployments over the last 6 months.

---
## 6. Cloud Run Production & Dev Deployments

* **Production Environment:**
  * **Service Name:** `your-service`
  * **GCP Project:** `your-gcp-project-id`
  * **Active Region:** `your-region` (Hong Kong)
  * **Production Endpoint URL:** [https://your-service-PROJECT_NUMBER.your-region.run.app](https://your-service-PROJECT_NUMBER.your-region.run.app)
  * **Custom Domain:** [https://portal.example.com](https://portal.example.com)

* **Dev Environment:**
  * **Service Name:** `your-dev-service`
  * **GCP Project:** `your-gcp-project-id`
  * **Active Region:** `your-region` (Hong Kong)
  * **Database:** `your_dev_db` on Cloud SQL instance `your-sql-instance`
  * **Dev Endpoint URL:** [https://your-dev-service-PROJECT_NUMBER.your-region.run.app](https://your-dev-service-PROJECT_NUMBER.your-region.run.app)

---

############# 7. App State & Progress
 
##### Accomplished Tasks (Latest Session Milestone)
* **Emphasized Big & Bold Titles (100% Complete):**
  * Raised card titles to `1.22rem` with `800` weight and modal dialog titles to `1.45rem` with `800` font weight for strong visual prominence.
* **Streamlined UI Layout & Word Counts (100% Complete):**
  * Simplified step presentations, increased typography sizes to `14px`, and applied concise, easily scannable descriptions across all playbooks.
* **Collapsible Prompt Container (Default Closed) (100% Complete):**
  * Wrapped prompt blocks in a native `<details class="prompt-collapsible">` (collapsed by default, referencing Claude Prompt Library design) to keep layouts uncluttered.
* **Adaptive Tag Presentation (100% Complete):**
  * Rendered compact icon-only badges (`.tag-icon-only`) with hover tooltips on overview cards.
  * Rendered comprehensive badges (`.tag-full` with icon and text label) inside the detailed modal view.
* **Dual-Prompt Removal & Manual Tips Box (100% Complete):**
  * Eliminated the dual-prompt toggle slider and complex branch logic.
  * Added a dedicated `.manual-tip-box` providing clear manual file upload guidance when connectors are unavailable.
* **Dynamic "Fill in the Variables" Engine (100% Complete):**
  * Implemented automated `[VARIABLE_NAME]` token extraction, real-time input fields panel, and dynamic prompt preview/copy interpolation.
* **Schema Refactor & Roadmap/Checklist Removal (100% Complete):**
  * Dropped `verification_checkpoints` database table (`DROP TABLE IF EXISTS verification_checkpoints;`).
  * Removed timeline view navigation, checklist administration tabs, and related CRUD endpoints while preserving user feedback functionality.
* **Dev Cloud Run Deployment Ready (100% Complete):**
  * Validated server startup, schema migration, and API response on the dev configuration.

### Next Steps & Continuous Polish
1. **Deploy to Dev Instance:** Deploy latest build to `your-dev-service` on Cloud Run.
2. **End-to-End Dev Verification:** Validate prompt interpolation, collapsible state, and manual tips box live on `your-dev-service`.
3. **Monitor User Feedback:** Verify feedback submission and review from the floating widget into the admin portal.

