
export enum WeatherCondition {
  Sunny = 'Sunny',
  Cloudy = 'Cloudy',
  Rainy = 'Rainy'
}

export enum SystemScenario {
  Normal = 'Normal',
  Islanded = 'Islanded'
}

export enum SystemStrategy {
  Standard = 'Standard (Load-Follow)',
  Arbitrage = 'Economic Arbitrage',
  Greenshare = 'Max Self-Consumption'
}

export interface OutageInterval {
  start: number;
  end: number;
}

export interface SimulationParams {
  solarCapacityMW: number;
  batteryCapacityMWh: number;
  maxChargeRateMW: number;
  maxDischargeRateMW: number;
  minSocPercent: number;
  maxSocPercent: number;
  sunriseHour: number;
  sunsetHour: number;
  weather: WeatherCondition;
  scenario: SystemScenario;
  strategy: SystemStrategy;
  isDynamicTariff: boolean;
  
  // Refactored: Arrays for 24h high-fidelity modeling
  hourlyTemp: number[];     // Degrees C
  hourlyHumidity: number[]; // %
  hourlyCloud: number[];    // %

  maxGridImportMW: number;
  feedInTariffINR: number;
  dieselCapacityMW: number;
  dieselFuelCostINR: number;
  allowBatteryExport: boolean;
  importOutages: OutageInterval[];
  exportOutages: OutageInterval[];
}

export interface HourlyData {
  hour: number;
  baseLoadMW: number;
  adjustedLoadMW: number;
  solarMW: number;
  netLoadMW: number;
  gridImportMW: number;
  gridExportMW: number;
  dieselMW: number;
  batteryFlowMW: number;
  socStatePercent: number;
  priceINR: number;
  costGridOnly: number;
  costMicrogrid: number;
  revenueSoldINR: number;
  costDieselINR: number;
  netSavingsINR: number;
  isManualOverride: boolean;
  batteryReason: string;
}

export interface FinancialAudit {
  totalBillGridOnly: number;
  totalBillMicrogrid: number;
  totalRevenueINR: number;
  totalDieselCostINR: number;
  netSavingsINR: number;
  savingsPercent: number;
  totalLoadMWh: number;
  totalSolarMWh: number;
  totalGridImportMWh: number;
  totalGridExportMWh: number;
  totalDieselMWh: number;
  totalBatteryDischargeMWh: number;
  
  // Arbitrage Comparison Metrics
  baselineNetCost: number;       // Cost without Arbitrage (Standard Strategy)
  actualNetCost: number;         // Cost with Arbitrage
  arbitrageSavings: number;      // Difference
  arbitrageSavingsPercent: number;

  // New Detailed Baseline Metrics
  baselineBillMicrogrid: number;
  baselineRevenueINR: number;
  baselineDieselCostINR: number;

  // New Table Metrics
  baselineGridImportMWh: number;
  baselineDieselMWh: number;
  baselineBatteryCycles: number;
  baselinePeakGridMW: number;
  actualBatteryCycles: number;
  actualPeakGridMW: number;
}

export interface SimulationResult {
  hourlyData: HourlyData[];
  audit: FinancialAudit;
}

export interface LoadOverride {
  [hour: number]: number;
}

export interface TariffOverride {
  [hour: number]: number;
}
