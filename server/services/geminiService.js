const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Enhance user bio using Gemini AI
 * @param {string} userBio Raw user bio string
 * @returns {Promise<string>} Enhanced bio string
 */
const enhanceBioWithGemini = async (userBio) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
        throw new Error('GEMINI_API_KEY is not configured on the server. Please check your .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Prompt construction with strict instructions
    const prompt = `You are a professional profile bio editor.

Your task is to transform the user's raw profile information into a concise,
professional, natural-sounding biography.

STRICT RULES:

1. Use ONLY information explicitly provided by the user.
2. Do not invent skills, experience, companies, projects, education,
   certifications, achievements, job titles, years of experience, or
   qualifications.
3. Do not assume information that is not provided.
4. Correct grammar, spelling, punctuation, and sentence structure.
5. Improve clarity, professionalism, and readability.
6. Preserve the user's original meaning.
7. Naturally incorporate the technical skills explicitly mentioned by
   the user.
8. Keep the result concise and appropriate for a professional profile.
9. Do not use unnecessary buzzwords or exaggerated claims.
10. Do not mention that AI was used.
11. Return ONLY the final enhanced biography.
12. Do not add headings, bullet points, quotation marks, explanations,
    or commentary.

USER INPUT:
${userBio.trim()}`;

    let modelNames = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError = null;
    let resultText = '';

    // Execute with timeout and fallback model attempts
    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // 15 second timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini API request timed out.')), 15000)
            );

            const apiPromise = model.generateContent(prompt);
            const response = await Promise.race([apiPromise, timeoutPromise]);
            
            if (response && response.response) {
                resultText = response.response.text();
                if (resultText && resultText.trim()) {
                    break;
                }
            }
        } catch (err) {
            console.warn(`[Gemini Service] Model ${modelName} failed or unavailable:`, err.message);
            lastError = err;
        }
    }

    if (!resultText || !resultText.trim()) {
        throw new Error(lastError ? lastError.message : 'Failed to generate enhanced bio from Gemini AI.');
    }

    // Clean up result: remove leading/trailing quotes if present
    let cleanText = resultText.trim();
    if ((cleanText.startsWith('"') && cleanText.endsWith('"')) || (cleanText.startsWith('\'') && cleanText.endsWith('\''))) {
        cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }

    return cleanText;
};

module.exports = {
    enhanceBioWithGemini
};
