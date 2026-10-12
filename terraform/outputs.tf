output "service_url" {
  description = "The public URL of the deployed Gemini Enterprise - Edu Portal."
  value       = google_cloud_run_service.portal_service.status[0].url
}

output "database_connection_name" {
  description = "The connection string identifier of the PostgreSQL database instance."
  value       = google_sql_database_instance.postgres_instance.connection_name
}

output "infographic_bucket_url" {
  description = "Public base URL for generated use case infographics."
  value       = "https://storage.googleapis.com/${google_storage_bucket.infographics.name}/infographics/"
}
