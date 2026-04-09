const { GoogleGenerativeAI } = require('@google/generative-ai');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @param {string} jobDescription 
 * @returns {Promise<string>} The generated email text
 */
async function generateEmail(jobDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Write a professional cold email applying for a job based on the following description:
${jobDescription}

Include:
* Subject line
* Greeting
* Short intro
* Why I am a good fit
* Closing

Keep it concise and natural. Under 150-200 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('[AI Service Error] generateEmail failed:', error);
    throw new Error('AI Email generation failed');
  }
}

/**
 * @param {string} jobDescription 
 * @returns {Promise<{level: string, score: number, reason: string, missing: string[], strength: string[], insight: string}>} Match analysis
 */
async function generateMatchAnalysis(jobDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze how well a software developer's profile matches this job description. Assume the developer has skills in React, Node.js, Python, and basic UI/UX.

Job Description:
${jobDescription}

Return a JSON object with:
- level: "HIGH", "MEDIUM", or "LOW"
- score: percentage match (0-100)
- reason: brief explanation (1 sentence)
- missing: array of missing key skills
- strength: array of relevant skills the developer has
- insight: 1-line reasoning

Example:
{
  "level": "MEDIUM",
  "score": 65,
  "reason": "Good technical match but lacks specific domain experience",
  "missing": ["Figma", "UX research"],
  "strength": ["React", "frontend exposure"],
  "insight": "Candidate shows transferable skills but lacks direct UX experience"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Parse JSON
    let analysis;
    try {
      analysis = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch (parseError) {
      console.error('[AI Service Error] Failed to parse match analysis JSON:', parseError, text);
      analysis = {
        level: 'MEDIUM',
        score: 50,
        reason: 'Unable to parse AI response',
        missing: ['Analysis failed'],
        strength: ['Basic skills'],
        insight: 'Please review manually'
      };
    }
    return analysis;
  } catch (error) {
    console.error('[AI Service Error] generateMatchAnalysis failed:', error);
    // Default fallback
    return {
      level: 'MEDIUM',
      score: 50,
      reason: 'Unable to analyze match at this time',
      missing: ['Analysis unavailable'],
      strength: ['Basic skills'],
      insight: 'Please review manually'
    };
  }
}

module.exports = {
  generateEmail,
  generateMatchAnalysis
};
