output "service_url" {
  description = "Default Cloud Run URL of the portal."
  value       = google_cloud_run_v2_service.portal.uri
}

output "public_base_url" {
  description = "URL used in emailed links (custom domain when set, otherwise empty = request host)."
  value       = local.public_base_url
}

output "database_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance)."
  value       = google_sql_database_instance.postgres.connection_name
}

output "runtime_service_account" {
  description = "Service account the Cloud Run service runs as."
  value       = google_service_account.run.email
}

output "secret_ids" {
  description = "Secret Manager secrets holding the app's credentials."
  value       = sort([for s in google_secret_manager_secret.app : s.secret_id])
}

output "infographic_bucket_url" {
  description = "Public base URL for generated use case infographics."
  value       = "https://storage.googleapis.com/${google_storage_bucket.infographics.name}/infographics/"
}

output "domain_mapping_records" {
  description = "DNS records to create for the custom domain (empty when CUSTOM_DOMAIN is not set)."
  value       = try(google_cloud_run_domain_mapping.custom[0].status[0].resource_records, [])
}
