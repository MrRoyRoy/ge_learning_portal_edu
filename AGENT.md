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
* **Typographic Balance & Hierarchy (`/frontend-design`) (100% Complete):**
  * Established unified Swiss typography stack: `Outfit` (display/headings), `Plus Jakarta Sans` (interface body text), and `JetBrains Mono` (prompts, syntax, variable tokens).
  * Formulated full modular type scale (`--text-3xs` through `--text-4xl`), letter tracking (`--tracking-tighter` through `--tracking-widest`), and humanist line-height tokens (`--leading-none` through `--leading-relaxed`).
* **Enlarged Expanded Card View (Modal) (100% Complete):**
  * Expanded modal bounds to `94vw`, `max-width: 1360px`, `88vh` height with a 2-column prompt workbench layout (`350px 1fr`, responsive `1fr` on mobile).
  * Generous padding on use case titles (`8px 0 10px 0`), modal headers, and top navigation bar (`height: 72px; padding: 0 40px;`).
* **Interactive `{{}}` Variable Tokens & Click-to-Focus (100% Complete):**
  * Modernized variable tokens to `{{VARIABLE_NAME}}` format (supporting legacy `[...]` backwards compatibility).
  * Rendered clickable colored tokens (`.prompt-var-token`, `.token-braces`, `.is-filled`) in the prompt display that smoothly scroll, focus, and pulse (`@keyframes pulseVariableFocus`) the matching variable input field in the left column.
  * Real-time bi-directional interpolation between input fields, highlighted prompt display, and clipboard copy buffer.
* **Mouse-Reactive Ambient Background (100% Complete):**
  * Hardware-accelerated radial spotlight tracking cursor movement (`--mouse-x`, `--mouse-y`) over the subtle architectural canvas grid via `requestAnimationFrame`.
* **Enhanced Card Contrast & Rounded Surfaces (100% Complete):**
  * High-contrast card surfaces against dark ink canvas, defined `1.5px` borders, and rounded corners (`18px` on cards, `24px` on dialog modals).
* **Connector Filter Simplification (100% Complete):**
  * Removed connector toggle switches and lock overlays; replaced with clean colored indicator tags (`.connector-tag-drive`, `.connector-tag-email`, `.connector-tag-lms`, `.connector-tag-calendar`). All cards remain permanently unlocked.
* **3 Conceptual Steps Architecture (100% Complete):**
  * Refactored all 14 playbooks into 3 clear conceptual steps:
    1. **Step 1: Setup & Grounding** (with embedded collapsible helper prompts).
    2. **Step 2: Execute Sample Prompt** (with embedded 2-column interactive prompt workbench).
    3. **Step 3: Human Review & Delivery** (with manual upload fallback tip box and pro-tip container).
* **Prerequisite Helper Prompts Embedded in Steps (100% Complete):**
  * Added collapsible helper prompt cards with 1-click clipboard copying under Step 1 for prerequisites (e.g., generating assignment instructions and analytical grading rubrics for *Rubric-Aligned Essay Feedback Assistant*).
  * Fully populated and localized for all 14 use cases across English (`en`), Traditional Chinese (`zh-TW`), and Simplified Chinese (`zh-CN`).
* **Dev Cloud Run Deployment Ready (100% Complete):**
  * Validated server startup, schema migration, and API response locally with SQLite.

### Next Steps & Continuous Polish
1. **Deploy to Dev Instance:** Deploy latest build to `your-dev-service` on Cloud Run (`your-region`, `your-gcp-project-id`).
2. **End-to-End Dev Verification:** Validate prompt interpolation, token click-to-focus, collapsible states, and helper prompts live on `your-dev-service`.
3. **Monitor User Feedback:** Verify feedback submission and review from the floating widget into the admin portal.

