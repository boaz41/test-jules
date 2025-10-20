

import { GoogleGenAI } from "@google/genai";

// Fix: Per coding guidelines, initialize GoogleGenAI directly assuming API_KEY is present.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (productName: string, size: string): Promise<string> => {
  // Fix: Removed null check for 'ai' as per guideline to assume API key is always available.
  const prompt = `Generate a short, appealing, one-sentence marketing description for a juice product named "${productName}" with a size of "${size}". Focus on freshness and taste.`;

  try {
    // Fix: Correctly call generateContent and extract text. Model 'gemini-2.5-flash' is appropriate for this simple text task.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "Failed to generate AI description. Please try again.";
  }
};
