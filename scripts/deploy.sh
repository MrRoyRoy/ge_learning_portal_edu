#!/usr/bin/env bash
# ==============================================================================
# scripts/deploy.sh - provision infrastructure (Terraform) and ship the app
# (gcloud run deploy --source) for ONE environment described by an env file.
#
#   ./scripts/deploy.sh                          # .env, infra + app
#   ./scripts/deploy.sh --env-file .env.prod     # another environment
#   ./scripts/deploy.sh infra --env-file .env.dev   # Terraform only
#   ./scripts/deploy.sh app   --env-file .env.dev   # new app revision only
#   ./scripts/deploy.sh plan  --env-file .env.dev   # terraform plan, no changes
#   add --yes to skip Terraform's confirmation prompt
#
# Nothing environment-specific lives in this script: project, region, service
# names and secrets all come from the env file (see .env.example).
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT/terraform"
ENV_FILE="$ROOT/.env"
ACTION="all"
AUTO_APPROVE=""

die()  { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }
step() { printf '\n\033[36m▶ %s\033[0m\n' "$*"; }

# ---- Arguments ----------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    all|infra|app|plan) ACTION="$1" ;;
    --env-file) shift; [[ $# -gt 0 ]] || die "--env-file needs a path"; ENV_FILE="$1" ;;
    --env-file=*) ENV_FILE="${1#*=}" ;;
    --yes|-y) AUTO_APPROVE="-auto-approve" ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) die "Unknown argument: $1 (try --help)" ;;
  esac
  shift
done

[[ "$ENV_FILE" = /* ]] || ENV_FILE="$ROOT/$ENV_FILE"
[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE
  Create it first:  cp .env.example ${ENV_FILE#"$ROOT/"}  and fill in the values."

# ---- Load the env file (plain KEY=VALUE lines; export everything) --------------
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

# Fail early, listing every missing or still-placeholder value at once.
require() {
  local missing=()
  for name in "$@"; do
    local value="${!name:-}"
    if [[ -z "$value" || "$value" == your-* || "$value" == *your-gcp-project-id* ]]; then
      missing+=("$name")
    fi
  done
  [[ ${#missing[@]} -eq 0 ]] || die "Set these in ${ENV_FILE#"$ROOT/"} before deploying: ${missing[*]}"
}

require GCP_PROJECT_ID GCP_REGION CLOUD_RUN_SERVICE
command -v gcloud >/dev/null || die "gcloud CLI not found: https://cloud.google.com/sdk/docs/install"

# ---- Terraform ------------------------------------------------------------------
run_terraform() {
  local tf_cmd="$1"
  require CLOUD_SQL_INSTANCE INFOGRAPHIC_BUCKET SUPER_ADMIN_PASSWORD
  command -v terraform >/dev/null || die "terraform not found: https://developer.hashicorp.com/terraform/install"
  [[ ${#SUPER_ADMIN_PASSWORD} -ge 12 ]] || die "SUPER_ADMIN_PASSWORD must be at least 12 characters."

  # Map .env names to Terraform input variables (terraform/variables.tf).
  export TF_VAR_project_id="$GCP_PROJECT_ID"
  export TF_VAR_region="$GCP_REGION"
  export TF_VAR_service_name="$CLOUD_RUN_SERVICE"
  export TF_VAR_db_instance_name="$CLOUD_SQL_INSTANCE"
  export TF_VAR_infographic_bucket_name="$INFOGRAPHIC_BUCKET"
  export TF_VAR_db_name="${CLOUD_SQL_DATABASE:-edu_portal}"
  export TF_VAR_db_tier="${CLOUD_SQL_TIER:-db-f1-micro}"
  export TF_VAR_db_deletion_protection="${CLOUD_SQL_DELETION_PROTECTION:-true}"
  export TF_VAR_custom_domain="${CUSTOM_DOMAIN:-}"
  export TF_VAR_allow_unauthenticated="${ALLOW_UNAUTHENTICATED:-true}"
  export TF_VAR_max_instances="${CLOUD_RUN_MAX_INSTANCES:-10}"
  export TF_VAR_gemini_model="${GEMINI_MODEL:-gemini-3.8-flash}"
  export TF_VAR_demo_user_email="${DEMO_USER_EMAIL:-}"
  export TF_VAR_demo_user_ge_app_link="${DEMO_USER_GE_APP_LINK:-}"
  export TF_VAR_super_admin_password="$SUPER_ADMIN_PASSWORD"
  export TF_VAR_admin_password="${ADMIN_PASSWORD:-}"
  export TF_VAR_demo_user_password="${DEMO_USER_PASSWORD:-}"
  export TF_VAR_db_password="${DB_PASSWORD:-}"
  export TF_VAR_session_secret="${SESSION_SECRET:-}"
  export TF_VAR_settings_encryption_key="${SETTINGS_ENCRYPTION_KEY:-}"

  # State isolation per environment: a GCS backend prefix when TF_STATE_BUCKET is
  # set, otherwise a local workspace named after the project + service.
  local override="$TF_DIR/backend_override.tf"
  if [[ -n "${TF_STATE_BUCKET:-}" ]]; then
    printf 'terraform {\n  backend "gcs" {}\n}\n' > "$override"
    terraform -chdir="$TF_DIR" init -input=false -reconfigure \
      -backend-config="bucket=$TF_STATE_BUCKET" -backend-config="prefix=$CLOUD_RUN_SERVICE"
  else
    rm -f "$override"
    terraform -chdir="$TF_DIR" init -input=false -reconfigure
    terraform -chdir="$TF_DIR" workspace select -or-create "$GCP_PROJECT_ID-$CLOUD_RUN_SERVICE"
  fi

  if [[ "$tf_cmd" == "plan" ]]; then
    terraform -chdir="$TF_DIR" plan -input=false
  else
    terraform -chdir="$TF_DIR" apply -input=false $AUTO_APPROVE
  fi
}

# ---- App (Cloud Build from source → new Cloud Run revision) ---------------------
# Keeps the env vars, secrets, Cloud SQL volume and service account that Terraform set.
deploy_app() {
  step "Deploying the app to Cloud Run service $CLOUD_RUN_SERVICE ($GCP_PROJECT_ID / $GCP_REGION)"
  gcloud run deploy "$CLOUD_RUN_SERVICE" \
    --source "$ROOT" \
    --project "$GCP_PROJECT_ID" \
    --region "$GCP_REGION" \
    --quiet
  gcloud run services describe "$CLOUD_RUN_SERVICE" --project "$GCP_PROJECT_ID" --region "$GCP_REGION" \
    --format='value(status.url)'
}

case "$ACTION" in
  plan)  step "Terraform plan"; run_terraform plan ;;
  infra) step "Terraform apply"; run_terraform apply ;;
  app)   deploy_app ;;
  all)   step "Terraform apply"; run_terraform apply; deploy_app ;;
esac

step "Done."
