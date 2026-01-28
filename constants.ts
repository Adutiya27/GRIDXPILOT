import { WeatherCondition } from './types';

export const WEATHER_EFFICIENCY = {
  [WeatherCondition.Sunny]: 1.0,
  [WeatherCondition.Cloudy]: 0.6,
  [WeatherCondition.Rainy]: 0.2,
};

// UPPCL ToD Tariff for Agra (INR per kWh)
export const TARIFF = {
  SOLAR_DISCOUNT: 6.00, // 06:00 - 10:00
  PEAK: 9.00,           // 17:00 - 21:00
  NORMAL: 7.50,         // All other times
};

// Simulated dynamic market pricing (INR per kWh)
export const DYNAMIC_MARKET_TARIFF: number[] = [
  4.20, 3.80, 3.50, 3.20, 3.10, 3.50, // 00-05 Night trough
  5.50, 6.80, 8.20, 7.50, 6.50, 6.20, // 06-11 Morning ramp
  5.80, 5.50, 5.40, 6.00, 7.50, 9.80, // 12-17 Midday/Early Evening
  12.50, 11.20, 9.50, 7.80, 6.20, 5.10 // 18-23 Peak & Cooling
];

/**
 * Hourly Load Baseline (MW)
 */
export const HOURLY_LOAD_BASELINE: number[] = [
  0.115, 0.115, 0.115, 0.115, 0.115, 0.115, // 00-05
  0.250, 0.250, 0.250,                      // 06-08
  0.475, 0.475, 0.475, 0.475,               // 09-12
  0.475, 0.475, 0.475, 0.475,               // 13-16
  0.375, 0.375, 0.375,                      // 17-19
  0.225, 0.225, 0.225, 0.225,               // 20-23
];

export const INITIAL_SOC = 0.5; // 50%
export const DISCHARGE_LOAD_THRESHOLD = 1.5; // MW threshold to force discharge regardless of price