const { GoogleGenerativeAI } = require("@google/generative-ai");
const getProfile = require("../tools/getProfile");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function withRetry(fn, retries = 3, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      // Removed 429 from transient errors to prevent quota depletion during rate limits
      const isTransient = err.status === 503;
      if (isTransient && i < retries - 1) {
        console.log(`[Gemini] Transient error (${err.status}), retrying in ${delayMs}ms… (${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
}

// ─── Models ───────────────────────────────────────────────────────────────────
// Using gemini-2.0-flash-lite to reduce rate limit/quota issues on the free tier (replacement for 1.5-flash-8b)
const analysisModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  generationConfig: { responseMimeType: "application/json" },
});

const emailModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

async function getUserProfile(userId = null) {
  return await getProfile(userId);
}

async function generateMatchAnalysis(jobDescription, profile) {
  const prompt = `
Analyze this job description against the user profile.

JOB:
${jobDescription}

PROFILE:
${JSON.stringify(profile)}

Return ONLY valid JSON with no markdown or code fences:
{
  "level": "HIGH | MEDIUM | LOW",
  "score": number (0-100),
  "reason": "one sentence explanation",
  "missing": ["skill1", "skill2"],
  "strength": ["skill1", "skill2"],
  "insight": "one line reasoning",
  "suggestions": ["actionable step 1", "actionable step 2"]
}`;

  try {
    const result = await withRetry(() => analysisModel.generateContent(prompt));
    const text = result.response.text();

    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error("[aiCoreService] generateMatchAnalysis failed:", error.message);
    return null;
  }
}

async function generateEmail(jobDescription, profile, analysis) {
  const prompt = `
Write a professional cold email for a job application.

Rules:
- 120-150 words
- Natural human tone, not corporate
- Never start with "I am writing to apply" or "I am eager to apply"
- Start naturally: "I came across your opening..." or "This role caught my attention..."
- Mention 2-3 relevant skills from the job description
- Mention real projects from the profile
- Tone: ${analysis?.level === "HIGH" ? "confident" : analysis?.level === "LOW" ? "honest and growth-focused" : "balanced"}
- Return ONLY the plain email text, no subject line, no labels

JOB:
${jobDescription}

PROFILE:
${JSON.stringify(profile)}

ANALYSIS CONTEXT:
${JSON.stringify(analysis)}
`;

  try {
    const result = await withRetry(() => emailModel.generateContent(prompt));
    return result.response.text();
  } catch (error) {
    console.error("[aiCoreService] generateEmail failed:", error.message);
    throw error;
  }
}

module.exports = {
  getUserProfile,
  generateMatchAnalysis,
  generateEmail,
};