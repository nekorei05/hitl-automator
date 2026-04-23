require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.error) {
            console.error("API ERROR:", data.error);
        } else {
            console.log("AVAILABLE FLASH MODELS:");
            data.models.filter(m => m.name.includes("flash")).forEach(m => console.log(m.name, m.supportedGenerationMethods));
        }
    } catch(e) {
        console.error("FETCH ERROR:", e);
    }
})();
