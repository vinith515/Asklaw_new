import { GoogleGenAI, Type } from "@google/genai";
import { LegalResponse } from "../types";
import { findRelevantContext } from "./mockDb";

export const askLegalQuestion = async (question: string): Promise<LegalResponse> => {
  // API Key is strictly obtained from process.env as per security guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // In a real scenario this should be handled by environment setup
    console.error("API_KEY is missing from environment variables.");
    throw new Error("Service configuration error: API Key missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. RAG: Retrieve context from our mock "database" to ground the answer
    const context = await findRelevantContext(question);
    
    // 2. Construct Prompt for Gemini
    const prompt = `
      You are AskLaw, an expert AI legal assistant dedicated to simplifying legal concepts for laypeople.

      CRITICAL INSTRUCTIONS:
      1. **STRICT RELEVANCE CHECK**: You must ONLY answer questions related to Law, Legal Procedures, Rights, Contracts, Crime, or Civic Duties. 
         - If the USER QUESTION is NOT related to law (e.g., questions about cooking, coding, math, general greetings, or science), you MUST return a response stating the query is not relevant.
      
      2. **JURISDICTION**: You must strictly apply **INDIAN LAW** (e.g., Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), Indian Contract Act, Constitution of India, Family Courts Act, etc.). 
         - Do NOT cite US Law, UK Law, or General Common Law unless explicitly asked for a comparison.
         - Use Indian terminology (e.g., "FIR" instead of "Police Report", "Vakalatnama", "High Court").

      3. **CONTEXT**: Use the provided CONTEXT if it is relevant to Indian Law.

      CONTEXT:
      ${context || "No specific internal documents found. Rely on general Indian Statutes."}

      USER QUESTION:
      ${question}

      Output Requirement:
      You must return a valid JSON object. Do not include markdown formatting.
      
      If the question is NOT LEGAL:
      - "meaning": "I am designed to answer only legal queries related to Indian Law. Please ask a question about legal rights, contracts, crime, or regulations in India."
      - "options": []
      - "redFlags": []
      - "nextSteps": ["Ask a legal question", "Ask about Indian Acts or Sections"]
    `;

    // 3. Call Gemini API with Schema Enforcement
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { 
              type: Type.STRING,
              description: "A clear, plain-English explanation of the legal concept under Indian Law. Cite specific Indian Acts/Sections if applicable."
            },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 2-4 actionable legal choices available to an Indian citizen."
            },
            redFlags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 2-4 potential risks or warnings in the Indian legal context."
            },
            nextSteps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 2-4 concrete, immediate recommended actions (e.g., 'File an FIR', 'Consult a High Court Advocate')."
            }
          },
          required: ["meaning", "options", "redFlags", "nextSteps"]
        }
      }
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Empty response from AI model.");
    }

    // 4. Parse and Return
    return JSON.parse(responseText) as LegalResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Fallback for graceful failure in UI
    return {
      meaning: "We encountered an issue connecting to the AskLaw AI network. This could be due to high traffic or network connectivity issues.",
      options: ["Try your request again in a few seconds", "Check your internet connection"],
      redFlags: ["Analysis incomplete due to connection error"],
      nextSteps: ["Refresh the page", "Contact support if the issue persists"]
    };
  }
};