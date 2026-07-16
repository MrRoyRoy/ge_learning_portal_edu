# Gemini Enterprise - Academic Adoption & Playbook Portal

[![Live Deployment](https://img.shields.io/badge/Live-Google%20Cloud%20Run-blue?style=for-the-badge&logo=google-cloud&logoColor=white)](#cloud-production-deployment)
[![Platform Architecture](https://img.shields.io/badge/Architecture-Vanilla%20Minimalism-emerald?style=for-the-badge)](#technology-stack)
[![Language Support](https://img.shields.io/badge/Localization-EN%20%7C%20ZH--TW%20%7C%20ZH--CN-purple?style=for-the-badge)](#localization-dictionaries)

Welcome to the **Gemini Enterprise Edu Portal**, a high-fidelity, premium academic adoption roadmap and playbook orchestration platform. Custom-tailored for academic institutions, this system provides educational leaders, lecturers, support staff, and students with interactive, role-specific Gemini adoption pathways, interactive sandboxes, visual analytics, and persistent feedback collection loops.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [Technology Stack](#-technology-stack)
3. [Architecture & DB Schemas](#-architecture--db-schemas)
4. [Role-Specific Onboarding & Workflows](#-role-specific-onboarding--workflows)
5. [Local Development & Setup](#-local-development--setup)
6. [Cloud Production Deployment](#-cloud-production-deployment)
7. [Version Control & Release Workflow](#-version-control--release-workflow)

---

## 🌟 Core Features

### 📅 Dual-Track Chronological Timeline (View A)
A symmetrical, highly structured horizontal roadmap divided into key academic semesters: *August*, *September*, *October – November 15*, and *November 16 – January 15*.
* **Track 1 (Semester-Restricted Milestones)**: Houses four color-coded phase nodes (Indigo, Amber, Emerald, Blue, Coral, Purple) complete with separate progress tracking bars (Tech Provisioning, Launch & Onboard, Evaluation Pilot, Exam Prep & Audit). Clicking nodes slides open a dynamic panel allowing supervisors to assign/unassign adoption playbooks.
* **Track 2 (Continuous Rolling Initiatives)**: Designed as a continuous, thick progress pipeline capsule with interactive arrowhead anchors to represent semester-independent rolling initiatives (e.g. Identity Providers & Connector Configurations).

### 🌀 Isometric SVG Winding Verification Pipeline (View B)
An advanced engineering checklist system built on top of a futuristic grid layout:
* **Metallic 3D Pipeline**: Drawn with linear gradient SVG sheets, sheen gloss layers, and connector rings.
* **Pulsating Joints**: 5 glowing joints pulsating matching specific timeline phases.
* **Reactive Strikethroughs**: Completing phase checklist tasks triggers automatic line strikethroughs, joint glows, and dynamically transforms node colors into brilliant emerald rings.

### 🧪 Advanced Prompt Sandbox & Diff Viewer
* **Dynamic Connectors**: Playbook cards simulate enterprise connector toggles (Drive, Email, Calendar, LMS). If an *essential* connector is toggled off, the card is locked with a modern frosted-glass overlay.
* **Advanced Usage**: Toggling the advanced connector mode dynamically swaps steps, complex prompt payloads, and pro-tips between manual operations and cloud API workflows.
* **Gemini LLM Prompt Refiner**: Submit prompt changes to a mock Gemini LLM, which renders side-by-side color-coded syntax Diff comparisons (Current Draft vs Optimized suggestions).

### 📊 Real-time Administrative Telemetry
* Fully responsive data administration console plotting high-contrast vector line charts of cumulative Page Views, Likes, and Deployments compiled over a rolling 6-month historical log.
* Dynamic user provisioning tools supporting automatic creation, temporary password force-resets, and role switching.

### 💬 Persistent Universal Feedback Loops
* A beautiful fixed floating feedback button styled with linear-gradient, scale-up micro-animations, and modern glassmorphism.
* Automatically records the submitter's email context and provides an exclusive **User Feedbacks** console inside the Admin dashboard, restricted solely to the super-admin account, supporting real-time suggestions review and dismissals (crossing-off).

---

## 🛠 Technology Stack

* **Client Engine**: Vanilla HTML5, ES6+ JavaScript modules, and Material Symbols font icons.
* **Visual Styling**: Swiss-minimalist Vanilla CSS (`style.css`) utilizing standard layout grids, CSS variable maps (supporting Light and Dark modes), and dynamic micro-animations. **TailwindCSS is strictly avoided** to preserve precise typography.
* **Server Framework**: Node.js + Express (`server.js`) supporting session tracking via secure cookies and Bcrypt authentication hashing.
* **Dual Database Layer**:
  * *Production*: Scaled PostgreSQL client pooling (`pg`) optimized for container scaling on Google Cloud.
  * *Development/Fallback*: File-based SQLite database engine (`edu_portal.db`) with automated schema bootstraps.
* **Isolated VM Sandbox Parser**: Uses a Node.js isolated `vm` context to extract and seed 14 static academic playbooks and translations directly from the client script (`app.js`) upon first boot, preventing data duplication.

---

## 🏗 Architecture & DB Schemas

```mermaid
graph TD
  Client[Web Client: index.html + app.js] <-->|Fetch REST APIs / Cookies| Express[Express Server: server.js]
  Express <-->|Dual Pool| DB{DB Dialect Selector}
  DB -->|Production| PG[(PostgreSQL Pool)]
  DB -->|Local Fallback| SQLite[(SQLite File: edu_portal.db)]
  Express -->|Isolated Context Extraction| VM[Node.js VM Sandbox Seeder]
```

### Database Schema Table Definitions

#### 1. Users Table (`users`)
Stores authorization credentials, context configurations, and force-reset onboarding status:
* `email` (Primary Key, VARCHAR/TEXT)
* `password_hash` (TEXT, Not Null)
* `is_temp_password` (BOOLEAN/INTEGER, Default True)
* `role` (VARCHAR/TEXT, Default Null)
* `institution_level` (VARCHAR/TEXT, Default Null)
* `created_at` (TIMESTAMP)

#### 2. Editable Playbooks (`use_cases`)
* `id` (Primary Key, VARCHAR/TEXT)
* `category` (VARCHAR/TEXT)
* `is_verified` (BOOLEAN/INTEGER, Default False)
* `translations` (JSONB/TEXT) - Holds multilingual strings.
* `likes` (INTEGER, Default 0)
* `deployments` (INTEGER, Default 0)

#### 3. User Feedbacks (`feedbacks`)
Manages suggestions sent by portal users:
* `id` (Primary Key, SERIAL/AUTOINCREMENT)
* `user_email` (VARCHAR/TEXT, Not Null)
* `feedback_text` (TEXT, Not Null)
* `created_at` (TIMESTAMP)

---

## 👥 Role-Specific Onboarding & Workflows

To ensure highly targeted adoptions, the portal dynamically adapts its roadmaps, checklists, analytics, and navigation sidebars according to the user's selected role:

| Role Code | User Role | Targeted Responsibilities | Accessible Hubs |
| :--- | :--- | :--- | :--- |
| `Lecturer` | **Lecturer / Educator** | Teaching material designs, student engagement, and content creation. | Academic Hub |
| `TA` | **Teaching Assistant (TA)** | Grading assistance, course administration, and tutorial sessions. | Academic Hub |
| `Student` | **Student / Club Leader** | Assignment reviews, study groups, and student activities. | Student Center |
| `Program Leader` | **Program Leader / Dept Head** | Curriculum design, program accreditation, and course coordination. | Academic Hub, Operational Command |
| `Dean` | **Dean / Educational Leader** | Strategic planning, academic audits, and faculty management. | Academic Hub, Operational Command |
| `SAO` | **Student Affairs Officer (SAO)** | Student support, extracurricular activities, and counseling. | Student Center, Operational Command |
| `Finance` | **Financial Administrator** | Budget planning, funding auditing, and procurement control. | Operational Command |
| `Security` | **Campus Security Officer** | Incident reporting, access logging, and emergency coordination. | Operational Command |
| `IT Admin` | **IT Administrator / SysAdmin** | Provisioning, identity configurations, and connector integrations. | Operational Command |

---

## 🚀 Local Development & Setup

### Prerequisites
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/MrRoyRoy/ge_learning_portal_edu.git
   cd ge_learning_portal_edu
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Start the local Express server:
   ```bash
   npm run dev
   # or
   node server.js
   ```
4. Open your web browser and navigate to `http://localhost:3000`.

### Local Testing Accounts
* **Super-Admin**:
  * *Username/Email*: `edu_portal_s_admin`
  * *Password*: `<YOUR_SUPER_ADMIN_PASSWORD>` (configured via environment or defaults to fallback)
* **Assistant Admin**:
  * *Username/Email*: `edu_portal_admin`
  * *Password*: `<YOUR_ASSISTANT_ADMIN_PASSWORD>` (configured via environment or defaults to fallback)

> [!WARNING]
> **No Password Recovery Mechanism**: There is currently no automated password recovery flow for admin or super-admin accounts on the portal. Make sure you securely document and do not lose your customized administrative passwords during deployment!

---

## 📊 Database Schema & Entity-Relationship (ER) Diagram

The application implements a robust relational schema supported natively by both PostgreSQL (production) and SQLite (development fallback). Multi-row data metrics and checklist states are completely synchronized.

Below is the structured data architecture representing the relational connections between users, preferences, and checklist templates:

```mermaid
erDiagram
    USERS {
        string email PK "User unique identifier (lowercase)"
        string password_hash "Bcrypt salted credentials digest"
        boolean is_temp_password "Force reset flag on first login"
        string role "Assigned organizational role code"
        string institution_level "Targeted school segment"
        timestamp created_at "Account creation datetime"
    }
    USE_CASES {
        string id PK "System playbook alphanumeric key"
        string category "Vertical category grouping"
        boolean is_verified "Content validation audit flag"
        text translations "Dynamic internationalized JSON dictionary"
        integer likes "Aggregated user bookmark counter"
        integer deployments "Active deployment indicator counter"
        timestamp created_at "Insertion datetime"
        timestamp updated_at "Latest modification timestamp"
    }
    FEEDBACKS {
        integer id PK "Auto-increment serial ID"
        string user_email "Submitter context email address"
        text feedback_text "User suggestion raw string content"
        timestamp created_at "Submission timestamp"
    }
    VERIFICATION_CHECKPOINTS {
        string id PK "Checkpoint unique alphanumeric key"
        string role "Targeted organizational role code"
        string stage_id "Timeline milestone identifier"
        text text "English checklist requirement"
        text text_zh "Traditional Chinese translation fallback"
        text text_cn "Simplified Chinese translation fallback"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Update timestamp"
    }
    USER_PREFERENCES {
        string email PK "User context identifier"
        string use_case_id PK "Bookmarked playbook identifier"
        boolean is_liked "Dynamic bookmark status flag"
        boolean is_deployed "Dynamic active installation status flag"
        timestamp updated_at "Interaction update timestamp"
    }
    ANALYTICS {
        integer id PK "Telemetry sequence auto-increment"
        string user_email "Performer identification context"
        string use_case_id "Targeted playbook key (nullable)"
        string action "Action identifier (view | like | deploy)"
        timestamp timestamp "Event logging datetime"
    }

    USERS ||--o{ FEEDBACKS : "submits"
    USERS ||--o{ USER_PREFERENCES : "customizes"
    USERS ||--o{ ANALYTICS : "triggers"
    USE_CASES ||--o{ USER_PREFERENCES : "receives"
    USE_CASES ||--o{ ANALYTICS : "tracks"
```

---

## ☁️ Cloud Production Deployment

The portal is scale-optimized for serverless execution on **Google Cloud Run** connected securely to a **Google Cloud SQL PostgreSQL** instance.

### Production Environment Requirements:
* **Cloud Run Service Service Account**: Needs the **Cloud SQL Client** (`roles/cloudsql.client`) permission to access the serverless instance sockets.
* **Environment Variables**:
  * `DATABASE_URL`: Connection string in Unix socket syntax (`postgres://<user>:<pwd>@/<db_name>?host=/cloudsql/<instance_connection_name>`).
  * `DISABLE_PG_SSL`: Set to `true` (SSL must be bypassed on local Cloud Run Unix sockets).
  * `NODE_ENV`: Set to `production` (enforces secure session cookies).

---

## 🛠️ Automated Infrastructure Provisioning (Terraform)

We provide modular, production-grade **Terraform** configurations to automate spinning up completely fresh environments (dev, staging, or production) in minutes.

The scripts reside in the `/terraform` subdirectory and provision:
1. **Google Cloud APIs**: Automatically activates Cloud Run, Cloud SQL, and Artifact Registry.
2. **Cloud SQL Instance**: Sets up a PostgreSQL 15 database (`db-f1-micro` tier) in your region.
3. **Database & Master Credentials**: Provisions the schema database `edu_portal` and secures credentials.
4. **IAM Permissions Binding**: Grants Cloud SQL Client access to your Cloud Run service identity.
5. **Cloud Run Service**: Deploys the service linked with connection sockets and correct environment configurations.
6. **Public Ingress Access Binding**: Configures `allUsers` IAM member for public website viewing.

### How to Deploy a New Environment with Terraform:

#### 1. Navigate to the Terraform Directory:
```bash
cd terraform
```

#### 2. Initialize the Providers & Modules:
```bash
terraform init
```

#### 3. Customize Your Variables:
Create a custom `terraform.tfvars` file to override default settings (GCP project, region, database password):
```hcl
project_id           = "<YOUR_GCP_PROJECT_ID>"
region               = "<YOUR_GCP_REGION>"
service_name         = "edu-ge-learning-portal"
db_instance_name     = "edu-portal-db"
db_password          = "YOUR_SECURE_POSTGRES_PASSWORD"
super_admin_password = "<YOUR_DESIRED_SUPER_ADMIN_PASSWORD>"
admin_password       = "<YOUR_DESIRED_ASSISTANT_ADMIN_PASSWORD>"
```

#### 4. Preview the Provisioning Infrastructure Plan:
```bash
terraform plan
```

#### 5. Apply and Provision Infrastructure:
```bash
terraform apply -auto-approve
```
Upon successful provisioning, Terraform will display your active **Service URL** and **Database Connection Name** inside outputs.

---

## 📈 Release & Code Update Workflows

To compile and re-deploy your container image via Google Cloud Build and deploy it to Cloud Run, execute:
```bash
gcloud run deploy <YOUR_CLOUD_RUN_SERVICE_NAME> --source . --region <YOUR_GCP_REGION> --allow-unauthenticated --project <YOUR_GCP_PROJECT_ID>
```

*Made with 💜 for advanced agentic software deployments and persistent educational portals.*
