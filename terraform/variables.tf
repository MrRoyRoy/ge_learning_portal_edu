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
