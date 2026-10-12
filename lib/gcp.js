/* lib/gcp.js - Google Cloud access token + request header helpers (Cloud Run metadata server or local gcloud) */

const { execSync } = require('child_process');

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'your-gcp-project-id';
// Local gcloud user credentials bill API calls to the gcloud "quota project" (which may differ from
// your-gcp-project-id), so local calls send x-goog-user-project. Service-account tokens on Cloud Run don't need it.
const GCP_QUOTA_PROJECT = process.env.GCP_QUOTA_PROJECT || GCP_PROJECT_ID;

// Memoised token: { token, source: 'metadata' | 'gcloud', expiresAt }
let cached = null;

const fetchMetadataToken = async () => {
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { token: data.access_token, source: 'metadata', expiresAt: Date.now() + ((data.expires_in || 300) - 60) * 1000 };
  } catch (err) {
    return null; // Not on GCP -> fall back to gcloud CLI
  }
};

const fetchGcloudToken = () => {
  const commands = ['gcloud auth application-default print-access-token', 'gcloud auth print-access-token'];
  for (const cmd of commands) {
    try {
      const token = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      // gcloud tokens live ~60 min; refresh well before that
      if (token) return { token, source: 'gcloud', expiresAt: Date.now() + 45 * 60 * 1000 };
    } catch (err) {
      // try next command
    }
  }
  return null;
};

const resolveToken = async () => {
  if (cached && cached.expiresAt > Date.now()) return cached;
  cached = (await fetchMetadataToken()) || fetchGcloudToken();
  if (!cached) throw new Error('Failed to retrieve a valid Google Cloud access token.');
  return cached;
};

// Dynamic OAuth Access Token helper for GCP metadata or local gcloud fallback
async function getGcpAccessToken() {
  return (await resolveToken()).token;
}

/**
 * Standard JSON headers for Google REST APIs.
 * Adds `x-goog-user-project` when running on local gcloud credentials (or when GCP_QUOTA_PROJECT is forced
 * via GCP_FORCE_QUOTA_HEADER=true) so Vertex AI / GCS bill the right project.
 */
async function gcpHeaders(extra = {}) {
  const { token, source } = await resolveToken();
  const withQuota = source === 'gcloud' || process.env.GCP_FORCE_QUOTA_HEADER === 'true';
  return {
    Authorization: `Bearer ${token}`,
    ...(withQuota && GCP_QUOTA_PROJECT ? { 'x-goog-user-project': GCP_QUOTA_PROJECT } : {}),
    ...extra
  };
}

module.exports = { getGcpAccessToken, gcpHeaders, GCP_PROJECT_ID, GCP_QUOTA_PROJECT };
