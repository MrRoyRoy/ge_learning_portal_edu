/* lib/infographics.js - Generate use case infographics with Vertex AI (Nano Banana) and publish them to GCS */

const fs = require('fs');
const path = require('path');
const { gcpHeaders, GCP_PROJECT_ID } = require('./gcp');

const INFOGRAPHIC_BUCKET = process.env.INFOGRAPHIC_BUCKET || 'your-infographic-bucket';
const INFOGRAPHIC_MODEL = process.env.INFOGRAPHIC_MODEL || 'gemini-nano-banana-2.1';
const INFOGRAPHIC_LOCATION = process.env.INFOGRAPHIC_LOCATION || 'global';
const INFOGRAPHIC_PROJECT = process.env.INFOGRAPHIC_PROJECT || GCP_PROJECT_ID;
const INFOGRAPHIC_PREFIX = 'infographics';

const MIME_EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };

// Brand guardrail: the infographic copy must never contain the forbidden terms, even if seed text did.
const scrubBrand = (s) => String(s || '')
  .replace(/\bGems?\b/g, 'Agent')
  .replace(/\bCopilot\b/gi, 'assistant');

/*
 * Mascot reference sheet. A small (~1024px, <300KB) copy of imgs/Archimedes.jpeg is sent as an inlineData
 * part next to the text prompt so the image model keeps "Archimedes" on-model across all 14 scenes.
 * Override with INFOGRAPHIC_REF_IMAGE; if the file is missing we fall back to the text-only description.
 */
const INFOGRAPHIC_REF_IMAGE = process.env.INFOGRAPHIC_REF_IMAGE
  || path.join(__dirname, '..', 'imgs', 'archimedes-ref.jpg');

// Read once and cache; returns null (never throws) so generation degrades gracefully without the file.
let refImageCache;
const loadRefImage = () => {
  if (refImageCache !== undefined) return refImageCache;
  try {
    const ext = path.extname(INFOGRAPHIC_REF_IMAGE).toLowerCase();
    refImageCache = {
      mimeType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
      data: fs.readFileSync(INFOGRAPHIC_REF_IMAGE).toString('base64')
    };
  } catch (err) {
    console.warn(`⚠️  Infographic reference image not found (${INFOGRAPHIC_REF_IMAGE}); using text-only character description.`);
    refImageCache = null;
  }
  return refImageCache;
};

/*
 * CONCEPT_HINTS: one witty visual metaphor per seeded use case id, so every scene is distinct.
 * `headline` is the only large text (2-4 words), `labels` are at most 3 tiny one/two-word tags.
 * Use cases not listed here (admin-created) fall back to a generic metaphor derived from title + summary.
 */
const CONCEPT_HINTS = Object.freeze({
  socratic_tutor: {
    headline: 'Ask, Don\'t Tell',
    scene: 'Archimedes as a wise tutor perched on a stack of lecture notes, holding up a giant glowing question mark like a lantern to light the path for a small, curious student-shaped paper airplane; question marks float around like fireflies',
    labels: ['Notes', 'Questions', '24/7']
  },
  rubric_grading: {
    headline: 'Feedback in Harmony',
    scene: 'Archimedes as an orchestra conductor on a podium, baton in wing, conducting a choir of singing essay pages; a rubric grid serves as the sheet music on his music stand',
    labels: ['Rubric', 'Essays', 'Feedback']
  },
  curriculum_design: {
    headline: 'Course Architect',
    scene: 'Archimedes in a hard hat over his mortarboard, building a bridge out of blank lined pages that spans from a classroom island to a city skyline of industry buildings, with a few trend-line charts as scaffolding; only one small tag on the bridge reads Syllabus',
    labels: ['Trends', 'Syllabus']
  },
  accreditation_reports: {
    headline: 'Evidence, Mapped',
    scene: 'Archimedes as an explorer cartographer unrolling a huge treasure map, connecting syllabi, outcome charts and assessment folders with dotted lines to a golden checkmark "X marks the spot"',
    labels: ['Syllabi', 'Outcomes', 'Criteria']
  },
  at_risk_cohort: {
    headline: 'Spot It Early',
    scene: 'Archimedes as a lighthouse keeper at the top of a lighthouse, sweeping a beam of light across a sea of data waves to spot small paper boats drifting off course and guide them back to shore',
    labels: ['Signals', 'Support']
  },
  club_funding: {
    headline: 'Plan. Budget. Go.',
    scene: 'Archimedes juggling calendar pages and gold coins while balancing on a unicycle, with a neat proposal scroll trailing behind him like a banner',
    labels: ['Calendar', 'Budget', 'Proposal']
  },
  finance_compliance: {
    headline: 'Receipts, Checked',
    scene: 'Archimedes as a detective with a magnifying glass, inspecting a conveyor belt of receipts; approved ones get a green checkmark symbol, a suspicious one is flagged red',
    labels: ['Receipts', 'Rules']
  },
  lab_manual_creator: {
    headline: 'Safe Science',
    scene: 'Archimedes in safety goggles and a tiny lab coat, pouring a bubbling beaker whose vapour turns into a neatly folded step-by-step manual with simple hazard-triangle icons',
    labels: ['Steps', 'Safety']
  },
  sao_scavenger_hunt: {
    headline: 'Hunt for Red Packets',
    scene: 'Archimedes as a treasure hunter hopping across a festive campus with paper lanterns, holding a phone scanning a QR code while red envelopes flutter out like confetti',
    labels: ['Trivia', 'Clues', 'Rewards']
  },
  security_simulator: {
    headline: 'Drill, Then Decide',
    scene: 'Archimedes as a calm commander at a tabletop model of the campus, moving toy pieces along a branching decision-tree path drawn on the board, with a small video screen showing a drill',
    labels: ['Scenario', 'Decisions']
  },
  su_advocacy: {
    headline: 'Hear Every Voice',
    scene: 'Archimedes pouring a flurry of speech bubbles and survey cards into a giant funnel, which come out the bottom as a tidy bar chart feeding a megaphone',
    labels: ['Voices', 'Insights']
  },
  su_helpdesk: {
    headline: 'Always On Call',
    scene: 'Archimedes as a friendly concierge behind a help desk under a half-sun half-moon clock, wearing a headset, sliding a policy handbook and a venue booking key across the counter',
    labels: ['Policies', 'Bookings', '24/7']
  },
  visual_campaign: {
    headline: 'Story in Motion',
    scene: 'Archimedes as a film director in a director\'s chair with a megaphone and clapperboard, as storyboard frames, posters and a game controller fly off a film reel into the sky',
    labels: ['Story', 'Images', 'Video']
  },
  workforce_federation: {
    headline: 'One Key, Many Doors',
    scene: 'Archimedes as a gatekeeper holding a single glowing golden key whose beams unlock several doors at once, linking a campus castle to a cloud platform',
    labels: ['SAML', 'OIDC', 'IdP']
  },
  special_consideration_workflow: {
    headline: 'Sort, Then Sign Off',
    scene: 'Archimedes as a railway signal operator in a small signal box, pulling levers that switch paper request envelopes onto two tracks, a short green track to a neat stack of letters and a longer amber track to a desk where a human hand holds a stamp marked with a checkmark; a sign at the fork shows a simple branching arrow',
    labels: ['Evidence', 'Route', 'Review']
  },
  scholarship_application_workflow: {
    headline: 'Draft, Score, Refine',
    scene: 'Archimedes as a friendly running coach with a stopwatch beside a looping track drawn on paper, where a student-shaped paper airplane carrying a personal statement laps through checkpoints with star scores, before reaching a finish line where a mentor figure gives a thumbs up',
    labels: ['Eligible', 'Score', 'Mentor']
  }
});

// Generic fallback for admin-created use cases: the model invents the metaphor from title + summary.
const fallbackHint = (uc) => ({
  headline: scrubBrand(uc.title),
  scene: `Archimedes acting out a witty visual metaphor for this idea: ${scrubBrand(uc.summary)}`,
  labels: []
});

/**
 * buildInfographicPrompt(uc) -> string
 * Modern tech editorial, cel-shaded vector scene starring the "Archimedes" raven mascot acting out a
 * per-use-case metaphor. Text is deliberately minimal: one headline and at most 3 tiny labels.
 * AGENT.md brand rules (no "Gem", no "Copilot") are enforced both by scrubbing and in the prompt.
 */
function buildInfographicPrompt(uc, { hasRef = true } = {}) {
  const hint = CONCEPT_HINTS[uc.id] || fallbackHint(uc);
  const headline = scrubBrand(hint.headline);
  const labels = (hint.labels || []).slice(0, 3).map(scrubBrand);
  const textRule = labels.length
    ? `The ONLY text allowed in the image: the headline "${headline}" and these tiny labels, each written exactly once: ${labels.map(l => `"${l}"`).join(', ')}.`
    : `The ONLY text allowed in the image: the headline "${headline}".`;
  const refLine = hasRef
    ? ' Use the attached reference only for the character design - do not copy its layout, grey background or its caption text.'
    : '';

  return `Create a 16:9 landscape illustration in a modern tech editorial style: cel-shaded vector illustration with clean, confident, uniform-weight line art. Flat color fills with hard-edged two-tone cel shading only: no gradients, no airbrush, no soft glows, no blur, no painterly texture. Simplify the feathers into a few bold shapes, like a polished animated-series character.

MAIN CHARACTER: "Archimedes"${hasRef ? ', the raven shown in the attached reference image' : ''}. Keep him on-model and instantly recognisable: a glossy black raven with a dark grey beak, wearing a black graduation mortarboard with a gold tassel, and one eye replaced by a glowing four-pointed Gemini sparkle (blue-violet-pink gradient). He is expressive, clever and playful.${refLine}

SCENE (topic: ${scrubBrand(uc.title)}): ${scrubBrand(hint.scene)}.
The scene is a fun, witty, conceptual visual metaphor; Archimedes is the hero and clearly the focal point.

COMPOSITION & STYLE
- Headline "${headline}" in a bold, clean sans-serif, placed in the top-left area with lots of breathing room.
- Plenty of whitespace; a light, clean, solid off-white background with at most a few flat geometric accent shapes (no gradient blobs, no halftone noise).
- Limited palette harmonious with Google colors: blue #4285F4, red #EA4335, yellow #FBBC04, green #34A853, plus Archimedes' black and soft greys.
- No paragraphs, no step descriptions, no numbered lists, no UI screenshots, no fake text or scribbles on papers (use simple lines instead).

RULES
- ${textRule} Spell every word exactly as given. Never repeat a label; books, stamps, signs and papers carry no other words (use symbols or simple lines).
- No logos, no brand marks, no real people or human faces.
- Never write the words "Gem" or "Copilot".`;
}

// Retries transient Vertex/GCS failures (429 / 5xx) with exponential backoff: 2s, 4s.
async function fetchWithRetry(url, init, attempts = 3) {
  let lastRes = null;
  for (let i = 0; i < attempts; i++) {
    lastRes = await fetch(url, init);
    if (lastRes.ok || (lastRes.status !== 429 && lastRes.status < 500)) return lastRes;
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 2000 * 2 ** i));
  }
  return lastRes;
}

const vertexUrl = () => {
  const host = INFOGRAPHIC_LOCATION === 'global' ? 'aiplatform.googleapis.com' : `${INFOGRAPHIC_LOCATION}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${INFOGRAPHIC_PROJECT}/locations/${INFOGRAPHIC_LOCATION}/publishers/google/models/${INFOGRAPHIC_MODEL}:generateContent`;
};

/**
 * generateInfographic(uc) -> { buffer, mimeType }
 * Calls generateContent with responseModalities ['IMAGE'] and a 16:9 imageConfig, then returns the
 * first inlineData part. If no image comes back, the error carries finishReason / any text part to help debugging.
 * When the Archimedes reference sheet is available it is sent as the first part (image, then text).
 */
async function generateInfographic(uc) {
  const ref = loadRefImage();
  const requestParts = [
    ...(ref ? [{ inlineData: ref }] : []),
    { text: buildInfographicPrompt(uc, { hasRef: Boolean(ref) }) }
  ];
  const res = await fetchWithRetry(vertexUrl(), {
    method: 'POST',
    headers: await gcpHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: requestParts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '16:9' }
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Vertex AI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const data = await res.json();
  const candidate = (data.candidates || [])[0] || {};
  const parts = (candidate.content && candidate.content.parts) || [];
  const imagePart = parts.find(p => p.inlineData && p.inlineData.data);

  if (!imagePart) {
    const textPart = parts.find(p => p.text);
    const reason = candidate.finishReason || (data.promptFeedback && data.promptFeedback.blockReason) || 'unknown';
    throw new Error(`No image returned (finishReason: ${reason})${textPart ? `: ${textPart.text.slice(0, 200)}` : ''}`);
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: (imagePart.inlineData.mimeType || 'image/png').toLowerCase()
  };
}

/**
 * uploadToGcs(buffer, objectName, contentType) -> public URL (cache-busted with ?v=<epoch>)
 * Uses the GCS JSON API multipart upload so we can set contentType + cacheControl in one request
 * (no @google-cloud/storage dependency). The bucket grants allUsers objectViewer, so the URL is public.
 */
async function uploadToGcs(buffer, objectName, contentType) {
  const boundary = `edu-portal-${Date.now().toString(36)}`;
  const metadata = { name: objectName, contentType, cacheControl: 'public, max-age=300' };
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`)
  ]);

  const url = `https://storage.googleapis.com/upload/storage/v1/b/${INFOGRAPHIC_BUCKET}/o?uploadType=multipart`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: await gcpHeaders({ 'Content-Type': `multipart/related; boundary=${boundary}` }),
    body
  });
  if (!res.ok) {
    throw new Error(`GCS upload ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const encodedName = objectName.split('/').map(encodeURIComponent).join('/');
  return `https://storage.googleapis.com/${INFOGRAPHIC_BUCKET}/${encodedName}?v=${Math.floor(Date.now() / 1000)}`;
}

// generateAndUpload(uc) -> { url, mimeType, bytes, buffer } : full pipeline for one use case.
async function generateAndUpload(uc) {
  const { buffer, mimeType } = await generateInfographic(uc);
  const ext = MIME_EXTENSIONS[mimeType] || 'png';
  const contentType = MIME_EXTENSIONS[mimeType] ? mimeType : 'image/png';
  const url = await uploadToGcs(buffer, `${INFOGRAPHIC_PREFIX}/${uc.id}.${ext}`, contentType);
  return { url, mimeType: contentType, bytes: buffer.length, buffer };
}

module.exports = {
  INFOGRAPHIC_BUCKET,
  INFOGRAPHIC_MODEL,
  INFOGRAPHIC_LOCATION,
  INFOGRAPHIC_PROJECT,
  INFOGRAPHIC_REF_IMAGE,
  CONCEPT_HINTS,
  buildInfographicPrompt,
  generateInfographic,
  uploadToGcs,
  generateAndUpload
};
