import { GoogleGenAI, Type } from "@google/genai";

interface ScannedWeatherData {
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyCloud: number[];
}

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: { data: base64Data, mimeType: file.type },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseWeatherGraph = async (file: File): Promise<ScannedWeatherData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API Key for vision scanning.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze this weather graph. Extract 24 hourly data points (00:00 to 23:00) for Temperature (C), Humidity (%), and Cloud Cover (%). Return strict JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
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

    if (!response.text) throw new Error("Vision parser returned no content.");
    const data = JSON.parse(response.text);

    const validate = (arr: any[]): number[] => {
      if (!arr || !Array.isArray(arr)) return Array(24).fill(0);
      if (arr.length === 24) return arr;
      const result = [...arr];
      while (result.length < 24) result.push(result[result.length - 1] || 0);
      return result.slice(0, 24);
    };

    return {
      hourlyTemp: validate(data.hourlyTemp),
      hourlyHumidity: validate(data.hourlyHumidity),
      hourlyCloud: validate(data.hourlyCloud)
    };
  } catch (error) {
    console.error("GridPilot X Vision Error:", error);
    // Return a safe neutral profile if parsing fails
    return {
      hourlyTemp: Array(24).fill(25),
      hourlyHumidity: Array(24).fill(50),
      hourlyCloud: Array(24).fill(0)
    };
  }
};
