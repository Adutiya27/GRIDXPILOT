import { GoogleGenAI, Type } from "@google/genai";
import { SimulationResult, WeatherCondition, SimulationParams } from "../types";

const formatDataForPrompt = (result: SimulationResult, params: SimulationParams) => {
  // Calculate averages from hourly data for meta summary
  const avgCloud = params.hourlyCloud.reduce((sum, val) => sum + val, 0) / params.hourlyCloud.length;
  const avgTemp = params.hourlyTemp.reduce((sum, val) => sum + val, 0) / params.hourlyTemp.length;

  const summary = {
    meta: {
      scenario: params.scenario,
      weather: params.weather,
      cloudCoverAvg: avgCloud.toFixed(1),
      tempCAvg: avgTemp.toFixed(1),
      strategy: "Economic Arbitrage (Fixed)"
    },
    audit: result.audit, // Includes new arbitrage savings metrics
    outages: {
      import: params.importOutages,
      export: params.exportOutages
    },
    // Providing full telemetry including EXPORT and AUX for valid physics check
    telemetry: result.hourlyData.map(h => ({
      t: h.hour,
      load: parseFloat(h.adjustedLoadMW.toFixed(3)),
      gen: parseFloat(h.solarMW.toFixed(3)),
      grid_in: parseFloat(h.gridImportMW.toFixed(3)),
      grid_out: parseFloat(h.gridExportMW.toFixed(3)), // Crucial for balance equation
      aux: parseFloat(h.dieselMW.toFixed(3)), // Crucial for balance equation
      batt: parseFloat(h.batteryFlowMW.toFixed(3)), // +Discharge, -Charge
      soc: Math.round(h.socStatePercent),
      state: h.batteryReason,
      price: h.priceINR
    }))
  };
  return JSON.stringify(summary, null, 2);
};

export const analyzeSimulation = async (result: SimulationResult, params: SimulationParams): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    **Role:** You are the Lead Microgrid Systems Engineer for the GridPilot X project.
    
    **Objective:** 
    Perform a "Gap Analysis & Power Quality Audit" specifically focusing on the performance of the **Economic Arbitrage Strategy**.
    Compare the Actual Net Cost vs the Baseline (Standard) Cost provided in the audit data.
    
    **MANDATORY OUTPUT REQUIREMENTS:**
    
    1. **Daily Scheduling Algorithm Output:**
       - Clearly list the schedule: When to CHARGE, When to DISCHARGE, When to USE GRID, When to BLOCK GRID, and DIESEL usage events.
       - Provide a concise text-based timeline or table representing the 24-hour plan.
       - Compare planned SoC vs real outcome if applicable (or note stability).
       
    2. **Scheduler Logic Transparency:**
       - Explain the WHY behind key events.
       - Format: "Hour X: [Event] -> [Reasoning]"
       - Example: "Hour 14: Tariff high (₹12.50) → Discharging battery to offset peak."
       - Example: "Hour 02: Tariff low (₹4.20) + Solar Forecast Low → Charging from Grid."

    3. **Cost-Optimal Schedule Visualization:**
       - Create a visual representation (using HTML/CSS styled elements like colored bars or a structured list) of the 24-hour cycle showing the dominant source/activity per hour (Grid, Solar, Batt Charge, Batt Discharge, Diesel).
       - This is the MOST important visual. Make it look like a timeline strip.
    
    4. **Scope of Improvement:**
       - Provide one or two concrete suggestions to further reduce the Total Cost or improve efficiency based on the telemetry.

    **Context Data (JSON):**
    ${formatDataForPrompt(result, params)}

    **Output Requirement (STRICT HTML for Light Theme):**
    - **Theme:** INDUSTRIAL LIGHT. Backgrounds must be WHITE or TRANSPARENT. Text must be SLATE-900.
    - **Forbidden:** Do NOT use black backgrounds, neon text, or dark mode styling. Do NOT use columns.
    - **Layout:** Single vertical flow.
    - **Styling:**
        - Headers: <h3> tags with class "text-lg font-bold uppercase tracking-wider text-brand-primary mb-2 mt-6".
        - Text: <p> tags with class "text-sm text-slate-600 leading-relaxed mb-4".
        - List Items: <li> tags with class "mb-2 text-sm text-slate-700".
        - Tables: Use standard <table> with class "w-full text-left text-sm border-collapse mb-4". Headers "bg-slate-50 text-slate-500 font-bold uppercase text-xs p-2 border-b". Cells "p-2 border-b border-slate-100".
        - Timeline: Use horizontal flexbox with colored divs for the 24h visualization.

    Return raw HTML only. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3, 
      }
    });
    let cleanText = response.text || "Diagnostic failed.";
    cleanText = cleanText.replace(/```html/g, '').replace(/```/g, '').trim();
    return cleanText;
  } catch (error) {
    console.error(error);
    return "<div class='p-4 bg-red-50 text-red-600 rounded-lg border border-red-100'><strong>CRITICAL ERROR:</strong> Neural Advisor offline. Node connectivity timeout.</div>";
  }
};

export const fetchAgraWeather = async (): Promise<{ 
  sunriseHour: number; 
  sunsetHour: number; 
  weather: WeatherCondition;
  temperatureC: number;
  cloudCoverPercent: number;
  humidityPercent: number;
}> => {
  // Legacy scalar fetch - keeping for backward compatibility if needed, 
  // but fetchHourlyWeather is preferred for the new engine.
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Current precise meteorological data for Agra, India.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sunriseTime: { type: Type.STRING },
            sunsetTime: { type: Type.STRING },
            weather: { type: Type.STRING, enum: ["Sunny", "Cloudy", "Rainy"] },
            temperatureC: { type: Type.NUMBER },
            cloudCoverPercent: { type: Type.NUMBER },
            humidityPercent: { type: Type.NUMBER }
          },
          required: ["sunriseTime", "sunsetTime", "weather", "temperatureC", "cloudCoverPercent", "humidityPercent"]
        }
      }
    });
    const data = JSON.parse(response.text);
    const toDecimal = (t: string) => {
      const parts = t.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return h + (m / 60);
    };
    return { 
      sunriseHour: toDecimal(data.sunriseTime), 
      sunsetHour: toDecimal(data.sunsetTime), 
      weather: data.weather as WeatherCondition,
      temperatureC: data.temperatureC,
      cloudCoverPercent: data.cloudCoverPercent,
      humidityPercent: data.humidityPercent
    };
  } catch (e) {
    return { sunriseHour: 6, sunsetHour: 18, weather: WeatherCondition.Sunny, temperatureC: 30, cloudCoverPercent: 10, humidityPercent: 40 };
  }
};

export const fetchHourlyWeather = async (): Promise<{
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyCloud: number[];
  sunriseHour: number;
  sunsetHour: number;
}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Get the hourly weather forecast for Agra, India for today. 
    I need the Temperature (Celsius), Humidity (%), and Cloud Cover (%) for every hour from 00:00 to 23:00 (24 data points). 
    Also find the local Sunrise and Sunset times for today.
    
    Important: ensure arrays have exactly 24 numbers.
  `;

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
            sunriseTime: { type: Type.STRING, description: "Format HH:MM in 24h format" },
            sunsetTime: { type: Type.STRING, description: "Format HH:MM in 24h format" }
          },
          required: ["hourlyTemp", "hourlyHumidity", "hourlyCloud", "sunriseTime", "sunsetTime"]
        }
      }
    });

    const data = JSON.parse(response.text);
    
    // Helper to validate array length
    const validate = (arr: any[]) => {
        if (!arr || !Array.isArray(arr)) return Array(24).fill(0);
        if (arr.length === 24) return arr;
        if (arr.length > 24) return arr.slice(0, 24);
        // Interpolate last value if short
        const last = arr[arr.length - 1] || 0;
        return [...arr, ...Array(24 - arr.length).fill(last)];
    };

    const toDecimal = (t: string) => {
      if (!t) return 6;
      const parts = t.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return h + (m / 60);
    };

    return {
      hourlyTemp: validate(data.hourlyTemp),
      hourlyHumidity: validate(data.hourlyHumidity),
      hourlyCloud: validate(data.hourlyCloud),
      sunriseHour: toDecimal(data.sunriseTime),
      sunsetHour: toDecimal(data.sunsetTime)
    };

  } catch (error) {
    console.error("Weather fetch failed", error);
    throw new Error("Failed to fetch hourly weather data");
  }
};