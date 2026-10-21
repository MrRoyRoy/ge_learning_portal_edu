# ==============================================================================
# Gemini Enterprise - Edu Portal infrastructure.
# Every name comes from variables.tf (filled from your .env by scripts/deploy.sh),
# so the same code can stand up any number of independent environments.
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.30, < 7.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ==========================================
# 1. APIs
# ==========================================
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com"
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ==========================================
# 2. Generated secrets (only used when the matching .env value is empty)
# ==========================================
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "session" {
  length  = 64
  special = false
}

resource "random_password" "encryption" {
  length  = 64
  special = false
}

locals {
  db_password             = var.db_password != "" ? var.db_password : random_password.db.result
  session_secret          = var.session_secret != "" ? var.session_secret : random_password.session.result
  settings_encryption_key = var.settings_encryption_key != "" ? var.settings_encryption_key : random_password.encryption.result
  public_base_url         = var.custom_domain != "" ? "https://${var.custom_domain}" : ""
}

# ==========================================
# 3. Cloud SQL for PostgreSQL
# ==========================================
resource "google_sql_database_instance" "postgres" {
  name             = var.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  depends_on = [google_project_service.apis]

  settings {
    tier = var.db_tier
    ip_configuration {
      ipv4_enabled = true # Cloud Run connects through the Cloud SQL connector socket, not an authorised network
    }
    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = var.db_deletion_protection
}

resource "google_sql_database" "portal" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
  project  = var.project_id
}

resource "google_sql_user" "app" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = local.db_password
  project  = var.project_id
}

# ==========================================
# 4. Runtime service account (least privilege, no project number needed)
# ==========================================
resource "google_service_account" "run" {
  project      = var.project_id
  account_id   = substr("${var.service_name}-run", 0, 30)
  display_name = "Cloud Run runtime for ${var.service_name}"
  depends_on   = [google_project_service.apis]
}

resource "google_project_iam_member" "run_roles" {
  for_each = toset([
    "roles/cloudsql.client", # Cloud SQL connector socket
    "roles/aiplatform.user"  # Gemini drafting + infographic generation
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.run.email}"
}

# ==========================================
# 5. Secret Manager
# ==========================================
/*
 * Each app secret becomes one Secret Manager secret named "<service_name>-<env-var-in-kebab-case>".
 * The always-present ones are listed first; optional ones only exist when their .env value is set.
 * for_each keys are derived from non-sensitive booleans only, because Terraform refuses sensitive keys.
 */
locals {
  secret_values = {
    DATABASE_URL            = "postgres://${google_sql_user.app.name}:${urlencode(local.db_password)}@/${var.db_name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
    SESSION_SECRET          = local.session_secret
    SETTINGS_ENCRYPTION_KEY = local.settings_encryption_key
    SUPER_ADMIN_PASSWORD    = var.super_admin_password
    ADMIN_PASSWORD          = var.admin_password
    DEMO_ADMIN_PASSWORD     = var.demo_admin_password
    DEMO_USER_PASSWORD      = var.demo_user_password
  }

  secret_names = toset(concat(
    ["DATABASE_URL", "SESSION_SECRET", "SETTINGS_ENCRYPTION_KEY", "SUPER_ADMIN_PASSWORD"],
    nonsensitive(var.admin_password != "") ? ["ADMIN_PASSWORD"] : [],
    nonsensitive(var.demo_admin_password != "") ? ["DEMO_ADMIN_PASSWORD"] : [],
    nonsensitive(var.demo_user_password != "") && var.demo_user_email != "" ? ["DEMO_USER_PASSWORD"] : []
  ))
}

resource "google_secret_manager_secret" "app" {
  for_each  = local.secret_names
  project   = var.project_id
  secret_id = "${var.service_name}-${lower(replace(each.key, "_", "-"))}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "app" {
  for_each    = local.secret_names
  secret      = google_secret_manager_secret.app[each.key].id
  secret_data = local.secret_values[each.key]
}

resource "google_secret_manager_secret_iam_member" "run_access" {
  for_each  = local.secret_names
  project   = var.project_id
  secret_id = google_secret_manager_secret.app[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run.email}"
}

# ==========================================
# 6. Infographics bucket (public read, app writes)
# ==========================================
# Generated infographics are embedded directly in the portal via public
# storage.googleapis.com URLs, so objects are world-readable. Only the
# runtime service account may write/overwrite them.
resource "google_storage_bucket" "infographics" {
  name                        = var.infographic_bucket_name
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true
  force_destroy               = false

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket_iam_member" "infographics_public_read" {
  bucket = google_storage_bucket.infographics.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "infographics_run_writer" {
  bucket = google_storage_bucket.infographics.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.run.email}"
}

# ==========================================
# 7. Cloud Run service
# ==========================================
locals {
  # Plain (non-secret) runtime settings; empty values are dropped.
  plain_env = { for k, v in {
    NODE_ENV              = "production"
    DISABLE_PG_SSL        = "true" # the Cloud SQL socket is already encrypted
    GCP_PROJECT_ID        = var.project_id
    INFOGRAPHIC_BUCKET    = google_storage_bucket.infographics.name
    GEMINI_MODEL          = var.gemini_model
    PUBLIC_BASE_URL       = local.public_base_url
    DEMO_USER_EMAIL       = var.demo_user_email
    DEMO_USER_GE_APP_LINK = var.demo_user_ge_app_link
  } : k => v if v != "" }
}

resource "google_cloud_run_v2_service" "portal" {
  name                = var.service_name
  location            = var.region
  project             = var.project_id
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.run.email

    scaling {
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = var.initial_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        startup_cpu_boost = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      dynamic "env" {
        for_each = local.plain_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.secret_names
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app[env.value].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  # scripts/deploy.sh ships the real image with `gcloud run deploy --source`; don't roll it back on the next apply.
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      template[0].annotations,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_project_iam_member.run_roles,
    google_secret_manager_secret_iam_member.run_access,
    google_secret_manager_secret_version.app,
    google_sql_database.portal,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = google_cloud_run_v2_service.portal.location
  name     = google_cloud_run_v2_service.portal.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ==========================================
# 8. Optional custom domain
# ==========================================
# Cloud Run domain mappings need a verified domain (Search Console) and are only
# available in some regions. Elsewhere, put a global external HTTPS load balancer
# in front instead and keep CUSTOM_DOMAIN set so PUBLIC_BASE_URL is correct.
resource "google_cloud_run_domain_mapping" "custom" {
  count    = var.custom_domain != "" ? 1 : 0
  name     = var.custom_domain
  location = var.region
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.portal.name
  }
}
