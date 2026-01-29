import { GoogleGenAI, Type } from "@google/genai";
import { SimulationResult, WeatherCondition, SimulationParams } from "../types";

/**
 * Formats the simulation results into a compact JSON string for the LLM.
 */
const formatDataForPrompt = (result: SimulationResult, params: SimulationParams): string => {
  const avgCloud = params.hourlyCloud.reduce((sum, val) => sum + val, 0) / params.hourlyCloud.length;
  const avgTemp = params.hourlyTemp.reduce((sum, val) => sum + val, 0) / params.hourlyTemp.length;

  const summary = {
    meta: {
      project: "GridPilot X",
      node: "AGRA",
      scenario: params.scenario,
      weather: params.weather,
      cloudCoverAvg: avgCloud.toFixed(1),
      tempCAvg: avgTemp.toFixed(1),
    },
    audit: result.audit,
    telemetry: result.hourlyData.map(h => ({
      t: h.hour,
      load: parseFloat(h.adjustedLoadMW.toFixed(3)),
      gen: parseFloat(h.solarMW.toFixed(3)),
      grid_in: parseFloat(h.gridImportMW.toFixed(3)),
      grid_out: parseFloat(h.gridExportMW.toFixed(3)),
      aux: parseFloat(h.dieselMW.toFixed(3)),
      batt: parseFloat(h.batteryFlowMW.toFixed(3)),
      soc: Math.round(h.socStatePercent),
      state: h.batteryReason,
      price: h.priceINR
    }))
  };
  return JSON.stringify(summary);
};

/**
 * Analyzes the simulation data using Gemini 3.
 * Returns an HTML engineered report or a fallback error message.
 */
export const analyzeSimulation = async (result: SimulationResult, params: SimulationParams): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("GridPilot X: Missing API_KEY environment variable.");
    return "<div class='p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-mono text-xs'>[SYSTEM ERROR] CRITICAL: Node connectivity failure. API Key not detected in environment.</div>";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    **Role:** Lead Microgrid Systems Engineer for GridPilot X.
    **Objective:** Perform a Gap Analysis & Power Quality Audit.
    
    **REQUIRED OUTPUT (HTML Only):**
    1. **Daily Scheduling Algorithm Output:** Concisely list the 24h plan (Charge/Discharge/Grid/Diesel).
    2. **Scheduler Logic Transparency:** Format as "Hour X: [Event] -> [Reasoning]".
    3. **Cost-Optimal Timeline:** Create a horizontal flexbox timeline with colored bars for dominant activities.
    4. **Scope of Improvement:** Provide 2 concrete technical suggestions.

    **Context Data:** ${formatDataForPrompt(result, params)}

    **Styling Rules:** Use Industrial Light theme (white bg, slate-900 text). Use Tailwind-like HTML classes. No Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    if (!response || !response.text) throw new Error("Empty response from AI");
    
    let cleanHtml = response.text.replace(/```html/g, '').replace(/```/g, '').trim();
    return cleanHtml;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return `
      <div class="p-6 bg-slate-50 border border-brand-border rounded-lg text-brand-text">
        <h3 class="text-sm font-bold uppercase mb-2">Audit Interrupted</h3>
        <p class="text-xs text-brand-text-dim">The Neural Strategist encountered a processing error. Local simulation physics remain valid.</p>
        <p class="text-[10px] font-mono mt-4 opacity-50">${error instanceof Error ? error.message : "Internal SDK Timeout"}</p>
      </div>
    `;
  }
};

/**
 * Fetches hourly weather forecast for Agra.
 * Returns a robust fallback if API fails.
 */
export const fetchHourlyWeather = async (): Promise<{
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyCloud: number[];
  sunriseHour: number;
  sunsetHour: number;
}> => {
  const apiKey = process.env.API_KEY;
  const defaultData = {
    hourlyTemp: Array(24).fill(30).map((t, i) => t + Math.sin((i - 6) * Math.PI / 12) * 10),
    hourlyHumidity: Array(24).fill(50),
    hourlyCloud: Array(24).fill(10),
    sunriseHour: 6.0,
    sunsetHour: 18.5
  };

  if (!apiKey) return defaultData;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = "Get 24-hour forecast for Agra, India: Temperature (C), Humidity (%), Cloud Cover (%). Also Sunrise/Sunset times.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hourlyTemp: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            hourlyHumidity: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            hourlyCloud: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            sunriseTime: { type: Type.STRING },
            sunsetTime: { type: Type.STRING }
          },
          required: ["hourlyTemp", "hourlyHumidity", "hourlyCloud", "sunriseTime", "sunsetTime"]
        }
      }
    });

    const data = JSON.parse(response.text);
    const toDecimal = (t: string) => {
      const parts = (t || "06:00").split(':');
      return parseInt(parts[0]) + (parseInt(parts[1]) / 60);
    };

    return {
      hourlyTemp: data.hourlyTemp.slice(0, 24),
      hourlyHumidity: data.hourlyHumidity.slice(0, 24),
      hourlyCloud: data.hourlyCloud.slice(0, 24),
      sunriseHour: toDecimal(data.sunriseTime),
      sunsetHour: toDecimal(data.sunsetTime)
    };
  } catch (error) {
    console.warn("Weather sync failed, using default Agra profile.", error);
    return defaultData;
  }
};
