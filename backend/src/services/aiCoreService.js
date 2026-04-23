const { GoogleGenerativeAI } = require("@google/generative-ai");
const getProfile = require("../tools/getProfile");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model Fallback Chain 
const MODEL_CHAIN = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

async function generateWithFallback(prompt, options = {}) {
  const { jsonMode = false } = options;
  let lastError = null;

  for (const modelName of MODEL_CHAIN) {
    const config = jsonMode
      ? { model: modelName, generationConfig: { responseMimeType: "application/json" } }
      : { model: modelName };

    const model = genAI.getGenerativeModel(config);

    // Per-model: retry once on 503 but never on 429
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}${attempt > 0 ? ` (retry ${attempt})` : ""}`);
        const result = await model.generateContent(prompt);
        console.log(`[Gemini] ✓ Success with ${modelName}`);
        return result;
      } catch (err) {
        lastError = err;

        if (err.status === 429) {
          console.warn(`[Gemini] ✗ ${modelName} quota exhausted (429), trying next model…`);
          break; 
        }

        if (err.status === 503 && attempt === 0) {
          console.log(`[Gemini] ${modelName} returned 503, retrying in 3s…`);
          await new Promise((r) => setTimeout(r, 3000));
          continue; 
        }

        throw err;
      }
    }
  }

  // All models exhausted
  console.error("[Gemini] All models in fallback chain returned 429. Quota fully exhausted.");
  throw lastError;
}

// Public API 

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

Return ONLY valid JSON. Use this exact structure:
{
  "level": "HIGH", // Or MEDIUM or LOW
  "score": 85,
  "reason": "Strong match due to X and Y.",
  "missing": ["skill1", "skill2"],
  "strength": ["skill1", "skill2"],
  "insight": "This candidate is perfect for the backend role but lacks AWS.",
  "suggestions": ["Highlight project X", "Learn Y"]
}`;

  let text = "";
  try {
    const result = await generateWithFallback(prompt, { jsonMode: true });
    text = result.response.text();

    let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const startIndex = clean.indexOf('{');
    const endIndex = clean.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      clean = clean.substring(startIndex, endIndex + 1);
    }

    return JSON.parse(clean);
  } catch (error) {
    console.error("[aiCoreService] generateMatchAnalysis failed to parse JSON:", error.message);
    console.error("[aiCoreService] Raw output was:", text);
    return null;
  }
}

async function generateEmail(jobDescription, profile, analysis) {
  const prompt = `
Write a highly personalized, human-sounding cold email for a job application.

CRITICAL RULES FOR TONE AND STYLE:
1. Length: 100-150 words. Be concise and respect the reader's time.
2. Tone: Professional, confident, conversational. Sound like a senior peer offering value, NOT a desperate applicant or a robot.
3. BANNED PHRASES: "I am writing to apply", "I am eager to", "I am keen to", "delve into", "spearheaded", "synergy", "thrilled", "passion", "perfect fit".
4. Opening: Start directly and naturally. (e.g., "I noticed your opening for..." or "Your work on X caught my eye...")
5. Substance: Seamlessly weave in 2-3 core skills from the job description and map them directly to real projects from the profile. Don't just list skills; briefly mention *how* they were used.
6. Adaptability: If the profile lacks certain skills, lean into problem-solving or related accomplishments. 
7. Placeholders: DO NOT use placeholders like [Company Name] or [Insert Link]. Infer the company from the job description, or just say "your team".
8. Output Format: Return ONLY the plain email text body. Do NOT include a subject line. Do NOT include generic greetings like "Dear Hiring Manager". Do NOT include sign-offs like "Best, [My Name]". Just give me the paragraphs.

JOB TO ANALYZE:
${jobDescription}

CANDIDATE PROFILE:
${JSON.stringify(profile)}

MATCH ANALYSIS CONTEXT (Use this to guide the pitch):
${JSON.stringify(analysis)}
`;

  try {
    const result = await generateWithFallback(prompt);
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