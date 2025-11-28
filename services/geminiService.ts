import { GoogleGenAI } from "@google/genai";

// Ensure API Key is present
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateTacticalReport = async (incidentType: string, locationData: string): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please configure process.env.API_KEY.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are the AI Operating System of a futuristic "Dandelion Sentinel" drone system.
      An incident has been detected and monitored.
      
      Incident Type: ${incidentType}
      Location Environment: ${locationData}
      
      Generate a concise, high-tech tactical mission report (approx 100 words).
      Include:
      1. Signal Analysis (Frequency, Decibels)
      2. Threat Assessment
      3. Action Taken (Deployment stats)
      4. Outcome
      
      Output format: Plain text, military/technical style.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Offline: Unable to generate report due to connection error.";
  }
};