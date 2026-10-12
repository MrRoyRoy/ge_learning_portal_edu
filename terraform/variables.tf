variable "project_id" {
  description = "The Google Cloud Project ID to deploy resources into."
  type        = string
  default     = "ge-edu-demo"
}

variable "region" {
  description = "The Google Cloud region to deploy serverless services."
  type        = string
  default     = "asia-east2"
}

variable "service_name" {
  description = "The name of the Cloud Run serverless container service."
  type        = string
  default     = "edu-ge-learning-portal"
}

variable "db_instance_name" {
  description = "The name of the Cloud SQL PostgreSQL database instance."
  type        = string
  default     = "edu-portal-db"
}

variable "db_password" {
  description = "The password for the PostgreSQL master admin user. Note: Declared as sensitive to hide from CLI outputs. Since standard resources (google_sql_user) persist password state, do not set ephemeral=true as it would cause resource tracking errors in Terraform."
  type        = string
  sensitive   = true
}

variable "super_admin_password" {
  description = "The custom password for the edu_portal_s_admin account. Note: Declared as sensitive to hide from logs. Do not store in plain tfvars."
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "The custom password for the edu_portal_admin assistant account. Note: Declared as sensitive to prevent exposure."
  type        = string
  sensitive   = true
}

variable "project_number" {
  description = "The numeric project number of your Google Cloud project. Providing this is highly recommended as it completely bypasses the need for the Cloud Resource Manager API, preventing common chicken-and-egg deployment errors."
  type        = string
  default     = ""
}

variable "settings_encryption_key" {
  description = "Secret used to derive the AES-256-GCM key that encrypts the SMTP password stored in the app_settings table. Declared as sensitive. Supply via TF_VAR_settings_encryption_key. Changing it makes the stored SMTP password unreadable (it must be re-entered)."
  type        = string
  sensitive   = true
}

variable "infographic_bucket_name" {
  description = "Globally unique name of the public GCS bucket that stores generated use case infographics."
  type        = string
  default     = "ge-edu-demo-usecase-infographics"
}
