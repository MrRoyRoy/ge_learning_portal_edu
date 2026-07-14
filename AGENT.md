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
  * **Master Admin Account:** `edu_portal_s_admin` with password `HKEduDemo2026`.
  * **Admin Assist Account:** `edu_portal_admin` with password `HKEduDemo` (cannot Create, Update, or Delete use case playbooks).
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

## 4. Connector & Dynamic State Logic

The portal supports intelligent integration simulation via simulated enterprise connector toggles:

* **Nomenclature:**
  * All connector components are named generically in user-facing toasts and badges to ensure product agnosticism (e.g., **Drive Connector**, **Email Connector**, **Calendar Connector**, **LMS Connector**) rather than referencing vendor-specific software (like *Outlook* or *OneDrive*).
* **Essential Connectors vs. Optional Connectors:**
  * Use cases that strictly require an active integration (e.g., **Daily Academic Email Digest & Priority Planner**) carry a `connectorEssential: true` tag. These cards strictly show a locked overlay on the dashboard when their corresponding connector is toggled off.
  * Use cases where integrations are secondary enhancements (e.g. *Sentiment Feedback*, *Activities Calendar*) are tagged with `connectorEssential: false`. These cards remain **unlocked** on the dashboard and accessible to click at all times.
* **Modal Advanced Toggle:**
  * Inside the detailed modal view for non-essential connector use cases, an interactive slider checkbox ("Extend to Advanced Usage with Connectors") is rendered.
  * Toggling this checkbox instantly swaps the steps, prompts, and pro-tips between standard manual file upload variants and active cloud connector workflows.

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
## 6. Cloud Run Production Deployment

The production environment is deployed and scaled on **Google Cloud Run** to serve the active user base with high-availability:

* **Service Name:** `edu-ce-learning-portal`
* **GCP Project:** `ge-edu-demo`
* **Active Region:** `asia-east2` (Hong Kong)
* **Production Endpoint URL:** [https://edu-ce-learning-portal-1069209637728.asia-east2.run.app](https://edu-ce-learning-portal-1069209637728.asia-east2.run.app)
* **Access Mode:** Domain-restricted access (enforced via active Organization Policies). Public unauthenticated access (`allUsers` binding) can be added by temporarily bypassing domain restriction constraints in the GCP Console.
* **Cleanup Status:** Old duplicate deployments (`ge-edu-portal` and its Artifact Registry repository in `us-west1`) have been fully deleted and pruned.

### Standard Deployment & Release Workflow

To compile and deploy updates or new releases of the portal to the live production environment, follow this standardized step-by-step workflow:

1. **Verify Local Assets & Configuration:**
   * Ensure that `style.css`, `app.js`, `index.html`, and `server.js` contain no syntax errors and all dynamic references are correct.
   * Verify that local testing configurations do not override the production database environment values.

2. **Authenticate with Google Cloud SDK:**
   * Ensure you are authenticated with your authorized Google Cloud developer account:
     ```bash
     gcloud auth login
     ```

3. **Deploy Codebase to Google Cloud Run:**
   * Execute the standardized source-deployment command in your terminal within the root directory of the repository:
     ```bash
     gcloud run deploy edu-ce-learning-portal --source . --region asia-east2 --allow-unauthenticated --project ge-edu-demo
     ```
   * *Note on builds:* Google Cloud Run automatically leverages the root `Dockerfile` to compile and containerize the environment via Cloud Build, saving the resulting artifact within Artifact Registry in `asia-east2`.

4. **Verify Access & Organization Policies:**
    * If organization policies block public unauthenticated access, log in using your workspace domain credentials to access the production URL.
    * If public unauthenticated access is permitted by your organization policies, override the invoker role binding via:
      ```bash
      gcloud run services add-iam-policy-binding edu-ce-learning-portal --region=asia-east2 --member=allUsers --role=roles/run.invoker --project=ge-edu-demo
      ```

### Agent-Driven Deployment & Version Control Workflow

To streamline development, ensure version history consistency, and automate production releases, the following **Agent-Driven Deployment & Version Control Workflow** is followed:

#### Step 1: Git Commit & Push (Version Control)
Whenever the AI coding agent successfully implements code modifications, bug fixes, or enhancements, the agent must immediately stage, commit, and push the revisions to the remote GitHub repository under the user account **MrRoyRoy**:

1. Configure the Git author credentials locally:
   ```bash
   git config user.name "MrRoyRoy"
   git config user.email "yuwcheung@gmail.com"
   ```
2. Stage and commit the modified files with a descriptive, professional commit message:
   ```bash
   git add .
   git commit -m "feat: [Descriptive Title of Accomplished Revisions]"
   ```
3. Push the local commits to the upstream repository branch:
   ```bash
   git push
   ```

#### Step 2: Live Cloud Run Production Deployment
Once version control has been synced, the agent triggers a live source-deployment to update the production container environment:

```bash
gcloud run deploy edu-ce-learning-portal --source . --region asia-east2 --allow-unauthenticated --project ge-edu-demo
```

#### GitHub Token & Secrets Storage
* **GitHub Personal Access Token (PAT):** Saved securely in the local project workspace in the [gp](file:///Users/roycheung/Desktop/dev-projects/edu-ge-adoption-portal/gp) file. This token authorizes push workflows and repository management actions.

---

######## 7. App State & Progress
 
#### Accomplished Tasks (Latest Session Milestone)
* **High-Fidelity Dual Timeline & Verification Pipeline Redesign (100% Complete):**
  * **Segmented Switcher Controller:** Built a premium sliding segmented toggle switcher allowing frictionless navigation between View A (Institutional Timeline) and View B (Verification Checkpoints).
  * **Dual-Track Academic Chronological Timeline (View A):**
    * Refactored into distinct chronological columns mapped to specific academic intervals: *Aug*, *Sep*, *Oct - Nov 15*, *Nov 16 - Jan 15*.
    * **Track 1 (Semester-Restricted implementations):** Four separate custom card-nodes matching specific border colors and tracking individual mini-progress bars (Tech Provisioning, Launch & Onboard, Evaluation Pilot, Exam Prep & Audit).
    * **Track 2 (Continuous Initiatives):** Designed as a full-width arrow chevron bar pointer spanning across semesters, dynamically styled to reflect completion percentage.
    * **Playbook Mapping Details Panel:** Selected nodes slide open an interactive panel to assign/unassign use-case playbooks dynamically, matching user preferences across active sessions.
  * **Isometric SVG Winding Pipeline Checklists (View B):**
    * Created a premium engineering background grid featuring multi-node interactive joints.
    * Drawn a custom isometric 3D metallic pipeline using linear gradient overlays, sheen gloss layers, and connector rings.
    * Engineered 5 pulsating HSL neon joint glow pins with staggered keyframe delays (`@keyframes pipelinePulse`) matching specific roadmap phases.
    * Built dynamic checklist cards with hover syncing (cross-highlighting between node hover and card focus), custom styled checkmark elements, and strikethrough logic.
    * Completing all items inside a checklist transforms the SVG node into an emerald indicator ring instantly.
* **Responsive Layout Fallbacks (100% Complete):**
  * View A gracefully switches to a chronological vertical stream layout on screen viewports <= 1024px.
  * View B collapses into a single-column block layout with the interactive SVG sticky sidebar flowing nicely.
* **Reactive Role-Switching Integration (100% Complete):**
  * Hooked `renderTimeline()` reactively into `handleOnboardingSubmit` and database-backed profile setup scripts. Switching active roles now instantly redraws custom verification checkpoints and filters playbooks in real-time.
* **Git Version Synchronization (100% Complete):**
  * Configured Git author properties and remote URL credentials. staged, committed, and successfully pushed the completed timeline features to GitHub repository (`MrRoyRoy/ge_learning_portal_edu`).
* **Live Google Cloud Run Production Release (100% Complete):**
  * Deployed the fully integrated application source successfully to live Cloud Run instancing (`edu-ce-learning-portal`) at [https://edu-ce-learning-portal-1069209637728.asia-east2.run.app](https://edu-ce-learning-portal-1069209637728.asia-east2.run.app).
* **Dual-Track Symmetrical Stacked Timeline & Color Matching (100% Complete):**
  * Redesigned the horizontal timeline into two stacked, isolated rows: Track 1 (Academic Calendar Milestones) and Track 2 (Continuous Rolling Initiatives), separated by a custom divider.
  * Solved the "off the track" browser alignment issue completely by positioning nodes, connector pins, and flags as peer sibling absolute elements of the horizontal track, guaranteeing they align down to the exact sub-pixel.
  * Compressed Track 1 height from 240px to 200px and tightened container paddings/gaps to maximize vertical space for details panels.
  * Converted Track 2 into a thick, clickable continuous progress pipeline capsule complete with a pulsating arrow head indicator, displaying checklist stats inline and removing unnecessary floating flags and connector pins.
  * Aligned milestone node colors to match their corresponding details cards (Indigo, Amber, Emerald, Blue, Coral, Purple) when active or completed, with visual guides and schedule flags echoing the exact color theme.

### Next Steps & Continuous Polish
1. **Institutional Telemetry Monitoring:** Evaluate administrative analytic dashboards to gauge actual workspace adoption and engagement rates across various user cohorts.
2. **Review Feedback Loops:** Check back with institutional leaders for custom playbooks or checkpoint adjustments.

