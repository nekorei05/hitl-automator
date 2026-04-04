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

module.exports = {
  generateEmail
};
