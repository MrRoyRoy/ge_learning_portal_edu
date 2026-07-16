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
  description = "The password for the PostgreSQL master admin user."
  type        = string
  sensitive   = true
  default     = "HKEduDemo2026"
}

variable "super_admin_password" {
  description = "The custom password for the edu_portal_s_admin account."
  type        = string
  sensitive   = true
  default     = "HKEduDemo2026"
}

variable "admin_password" {
  description = "The custom password for the edu_portal_admin assistant account."
  type        = string
  sensitive   = true
  default     = "HKEduDemo"
}
