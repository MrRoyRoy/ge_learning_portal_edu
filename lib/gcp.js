/* lib/gcp.js - Google Cloud access token + request header helpers (Cloud Run metadata server or local gcloud) */

const { execSync } = require('child_process');

// No hard-coded project: env first; otherwise getProjectId() asks the metadata server (Cloud Run) or gcloud.
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
// Local gcloud user credentials bill API calls to the gcloud "quota project" (which may differ from
// your project), so local calls send x-goog-user-project. Service-account tokens on Cloud Run don't need it.
const GCP_QUOTA_PROJECT = process.env.GCP_QUOTA_PROJECT || GCP_PROJECT_ID;

/*
 * getProjectId(): resolves the project once and memoises it.
 *   1. GCP_PROJECT_ID / GOOGLE_CLOUD_PROJECT env
 *   2. Metadata server (Cloud Run / GCE always know their own project)
 *   3. `gcloud config get-value project` (local development)
 * Throws when none of them answers, so callers fail with a clear message instead of calling a wrong project.
 */
let projectPromise = null;
const fetchMetadataProject = async () => {
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/project/project-id', {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(1500)
    });
    return res.ok ? (await res.text()).trim() : '';
  } catch (err) {
    return ''; // Not on GCP
  }
};
const fetchGcloudProject = () => {
  try {
    return execSync('gcloud config get-value project', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (err) {
    return '';
  }
};
function getProjectId() {
  if (!projectPromise) {
    projectPromise = (async () => GCP_PROJECT_ID || (await fetchMetadataProject()) || fetchGcloudProject())()
      .then((id) => {
        if (!id) {
          projectPromise = null; // allow a retry after the operator fixes the config
          throw new Error('Google Cloud project is not configured. Set GCP_PROJECT_ID in .env (see .env.example).');
        }
        return id;
      });
  }
  return projectPromise;
}

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
  const quotaProject = withQuota ? (GCP_QUOTA_PROJECT || await getProjectId().catch(() => '')) : '';
  return {
    Authorization: `Bearer ${token}`,
    ...(quotaProject ? { 'x-goog-user-project': quotaProject } : {}),
    ...extra
  };
}

module.exports = { getGcpAccessToken, gcpHeaders, getProjectId, GCP_PROJECT_ID, GCP_QUOTA_PROJECT };
