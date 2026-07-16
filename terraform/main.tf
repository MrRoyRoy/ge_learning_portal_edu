provider "google" {
  project = var.project_id
  region  = var.region
}

# ==========================================
# 1. API Enablement Services
# ==========================================
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ==========================================
# 2. Cloud SQL PostgreSQL Instance & Database
# ==========================================
resource "google_sql_database_instance" "postgres_instance" {
  name             = var.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  depends_on = [google_project_service.apis]

  settings {
    tier = "db-f1-micro" # Lightweight tier, scalable to high availability
    ip_configuration {
      ipv4_enabled = true
    }
  }

  deletion_protection = false # Set true for production safety
}

resource "google_sql_database" "portal_db" {
  name     = "edu_portal"
  instance = google_sql_database_instance.postgres_instance.name
  project  = var.project_id
}

resource "google_sql_user" "db_user" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres_instance.name
  password = var.db_password
  project  = var.project_id
}

# ==========================================
# 3. IAM Roles & Permissions Setup
# ==========================================
# Cloud Run Default Compute Service Account
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_iam_binding" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"

  members = [
    "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  ]
}

# ==========================================
# 4. Cloud Run Serverless Container Service
# ==========================================
resource "google_cloud_run_service" "portal_service" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  depends_on = [
    google_project_service.apis,
    google_sql_database.portal_db,
    google_sql_user.db_user
  ]

  template {
    spec {
      containers {
        # Deploy standard placeholder or custom Artifact Registry Docker image
        image = "gcr.io/cloudrun/hello" 

        ports {
          container_port = 8080
        }

        env {
          name  = "DATABASE_URL"
          value = "postgres://${google_sql_user.db_user.name}:${var.db_password}@/edu_portal?host=/cloudsql/${var.project_id}:${var.region}:${google_sql_database_instance.postgres_instance.name}"
        }

        env {
          name  = "DISABLE_PG_SSL"
          value = "true"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "SUPER_ADMIN_PASSWORD"
          value = var.super_admin_password
        }

        env {
          name  = "ADMIN_PASSWORD"
          value = var.admin_password
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }

      service_account_name = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "100"
        "run.googleapis.com/cloudsql-instances" = "${var.project_id}:${var.region}:${google_sql_database_instance.postgres_instance.name}"
        "run.googleapis.com/startup-cpu-boost"  = "true"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# ==========================================
# 5. Public Access Policy (Optional/Configurable)
# ==========================================
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.portal_service.name
  location = google_cloud_run_service.portal_service.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}
