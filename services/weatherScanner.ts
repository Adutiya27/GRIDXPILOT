import { GoogleGenAI, Type } from "@google/genai";

interface ScannedWeatherData {
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyCloud: number[];
}

// --- Helper: Convert File to Base64 for Gemini ---
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the "data:image/xxx;base64," prefix
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Main Function: Analyze Graph ---
export const parseWeatherGraph = async (file: File): Promise<ScannedWeatherData> => {
  // FIX 1: Use Vite-compatible Environment Variable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found in Netlify environment variables");
   
  // Initialize SDK
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert image file to AI-readable format
  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this weather forecast graph.
    Extract the 24 hourly data points (from 00:00 to 23:00) for:
    1. Temperature (Degrees Celsius) - Usually a solid line or primary number.
    2. Humidity (%) - Usually a blue area, or estimate inversely to temp if missing (high at night, low day).
    3. Cloud Cover (%) - Usually icons, bars, or gray area. If sunny icon, 0%. If cloudy, 50-100%.

    Return strictly a JSON object. Ensure each array has exactly 24 numbers.
    Interpolate visually if specific hours are not labeled.
  `;

  // FIX 2 & 3: Use stable model and correct 'contents' structure
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash', 
    contents: [
      {
        role: 'user',
        parts: [
          imagePart,       // The Image
          { text: prompt } // The Instruction
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hourlyTemp: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          hourlyHumidity: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          hourlyCloud: { type: Type.ARRAY, items: { type: Type.NUMBER } }
        },
        required: ["hourlyTemp", "hourlyHumidity", "hourlyCloud"]
      }
    }
  });

  if (!response.text) throw new Error("No data returned from vision analysis.");
   
  const data = JSON.parse(response.text);

  // Validation to ensure strictly 24 items (Engine requirement)
  const validate = (arr: any[]) => {
    if (!arr || !Array.isArray(arr)) return Array(24).fill(0);
    if (arr.length === 24) return arr;
    // Simple interpolation or truncation if AI fails strict count
    if (arr.length > 24) return arr.slice(0, 24);
    const last = arr[arr.length - 1] || 0;
    return [...arr, ...Array(24 - arr.length).fill(last)];
  };

  return {
    hourlyTemp: validate(data.hourlyTemp),
    hourlyHumidity: validate(data.hourlyHumidity),
    hourlyCloud: validate(data.hourlyCloud)
  };
};
