import { SimulationParams, HourlyData, SimulationResult, LoadOverride, FinancialAudit, SystemScenario, SystemStrategy, OutageInterval, TariffOverride } from '../types';
import { TARIFF, HOURLY_LOAD_BASELINE, DYNAMIC_MARKET_TARIFF } from '../constants';

// --- HELPER FUNCTIONS ---

const isHourInIntervals = (hour: number, intervals: OutageInterval[]): boolean => {
  return intervals.some(interval => {
    if (interval.start <= interval.end) {
      return hour >= interval.start && hour < interval.end;
    } else {
      return hour >= interval.start || hour < interval.end;
    }
  });
};

export const calculateTariff = (hour: number, isDynamic: boolean): number => {
  if (isDynamic) {
    const clampedHour = Math.floor(Math.max(0, Math.min(23, hour)));
    return DYNAMIC_MARKET_TARIFF[clampedHour];
  }
  if (hour >= 6 && hour < 10) return TARIFF.SOLAR_DISCOUNT;
  if (hour >= 17 && hour < 21) return TARIFF.PEAK;
  return TARIFF.NORMAL;
};

export const calculateSolar = (hour: number, params: SimulationParams, hourlyTempC: number, hourlyCloud: number, hourlyHumidity: number): number => {
  const { sunriseHour, sunsetHour, solarCapacityMW } = params;
  const midPoint = hour + 0.5;
  if (midPoint < sunriseHour || midPoint >= sunsetHour) return 0;
  
  const dayLength = sunsetHour - sunriseHour;
  const timeSinceSunrise = midPoint - sunriseHour;
  const sunPositionFactor = Math.sin((Math.PI * timeSinceSunrise) / dayLength);
  const ghi = 1000 * sunPositionFactor;

  const effectiveIrradiance = ghi * (1 - (hourlyCloud / 100));
  const tempLoss = Math.max(0, (hourlyTempC - 25) * 0.004);
  const humidityLoss = (hourlyHumidity / 100) * 0.2;
  const totalLoss = tempLoss + humidityLoss;
  
  const cleanIrradiance = effectiveIrradiance * (1 - totalLoss);
  return Math.max(0, (cleanIrradiance / 1000) * solarCapacityMW);
};

// --- SIMULATION ENGINE ---

const simulateDay = (
  params: SimulationParams, 
  loadOverrides: LoadOverride, 
  tariffOverrides: TariffOverride,
  initialSocPercent: number
): { data: HourlyData[], audit: FinancialAudit, endSocPercent: number, peakGridMW: number } => {
  
  const hourlyData: HourlyData[] = [];
  const BATTERY_EFFICIENCY = 0.92; // Round trip efficiency
  const SOC_MAX_MWh = (params.maxSocPercent / 100) * params.batteryCapacityMWh;
  const SOC_MIN_MWh = (params.minSocPercent / 100) * params.batteryCapacityMWh;
  
  let currentEnergyMWh = params.batteryCapacityMWh * Math.max(params.minSocPercent/100, Math.min(params.maxSocPercent/100, initialSocPercent));
  let peakGridMW = 0;
  
  let totals = {
    billGridOnly: 0,
    billMicrogrid: 0,
    revenueSold: 0,
    costDiesel: 0,
    load: 0,
    solar: 0,
    gridImport: 0,
    gridExport: 0,
    diesel: 0,
    battDischarge: 0
  };

  // --- PRE-CALCULATION STEP (THE LOOK-AHEAD SOLVER) ---
  // We generate the vectors for the whole day first to enable smart decision making
  const dayVector = Array.from({ length: 24 }, (_, h) => {
    // Tariff Logic: Check override first, then calculate default
    const tariff = tariffOverrides[h] !== undefined ? tariffOverrides[h] : calculateTariff(h, params.isDynamicTariff);
    
    const temp = params.hourlyTemp[h] || 25;
    const cloud = params.hourlyCloud[h] || 0;
    const humid = params.hourlyHumidity[h] || 50;
    const solar = calculateSolar(h, params, temp, cloud, humid);
    const load = loadOverrides[h] !== undefined ? loadOverrides[h] : HOURLY_LOAD_BASELINE[h];
    const net = load - solar; // Positive = Deficit, Negative = Surplus
    return { h, tariff, solar, load, net };
  });

  // Analyze Price Structure
  const sortedPrices = [...dayVector].map(d => d.tariff).sort((a, b) => a - b);
  // Refined thresholds for stricter Arbitrage
  const lowPriceThreshold = sortedPrices[Math.floor(sortedPrices.length * 0.25)]; // Bottom 25%
  const highPriceThreshold = sortedPrices[Math.floor(sortedPrices.length * 0.75)]; // Top 25%
  const maxPrice = sortedPrices[sortedPrices.length - 1];
  const avgPrice = sortedPrices.reduce((a, b) => a + b, 0) / 24;

  // Identify Peak Windows (Critical for Reservation Logic)
  const peakHours = dayVector.filter(d => d.tariff >= highPriceThreshold).map(d => d.h);
  
  // ---------------------------------------------------

  for (let hour = 0; hour < 24; hour++) {
    const vec = dayVector[hour];
    const hourlyTemp = params.hourlyTemp[hour] || 25;
    
    // Grid Availability Check
    const isImportBlocked = params.scenario === SystemScenario.Islanded || isHourInIntervals(hour, params.importOutages);
    const isExportBlocked = params.scenario === SystemScenario.Islanded || isHourInIntervals(hour, params.exportOutages);
    const effectiveGridLimit = isImportBlocked ? 0 : params.maxGridImportMW;

    // --- BATTERY PHYSICS ---
    const currentSocPercent = currentEnergyMWh / params.batteryCapacityMWh;
    
    // Thermal Throttling (>35C)
    let thermalDerating = 1.0;
    if (hourlyTemp > 35) {
        const excess = hourlyTemp - 35;
        thermalDerating = Math.max(0.1, 1.0 - (excess * 0.05));
    }

    // CC-CV Charging Curve (Slow down > 80% SoC)
    let cvDerating = 1.0;
    if (currentSocPercent > 0.8) {
        cvDerating = Math.max(0.05, (1 - currentSocPercent) / 0.2); 
    }

    const realTimeMaxChargeMW = params.maxChargeRateMW * thermalDerating * cvDerating;
    const realTimeMaxDischargeMW = params.maxDischargeRateMW; // Discharge is usually less affected by CV
    // -----------------------

    let netPower = vec.solar - vec.load; // Surplus (>0) or Deficit (<0)
    let batteryFlowMW = 0;
    let gridImportMW = 0;
    let gridExportMW = 0;
    let dieselMW = 0;
    let batteryReason = isImportBlocked ? "Grid Isolated" : "Standby";

    // === DECISION MATRIX ===

    // 1. SURPLUS CASE (Solar > Load)
    if (netPower > 0) {
      const surplus = netPower;
      
      // Standard Logic: Charge Battery first
      const spaceMWh = SOC_MAX_MWh - currentEnergyMWh;
      // How much can we physically charge?
      const chargeAmount = Math.min(surplus, realTimeMaxChargeMW, spaceMWh / BATTERY_EFFICIENCY);
      
      if (chargeAmount > 0) {
        batteryFlowMW = -chargeAmount; // Negative = Charging
        currentEnergyMWh += (chargeAmount * BATTERY_EFFICIENCY);
        batteryReason = "Solar Charge";
      }

      // Remaining surplus goes to grid (if allowed)
      const remaining = surplus - chargeAmount;
      if (remaining > 0 && !isExportBlocked) {
        gridExportMW = remaining;
        batteryReason = batteryReason === "Standby" ? "Solar Export" : "Charge & Export";
      } else if (remaining > 0) {
        batteryReason = "Curtailed";
      }
    } 
    
    // 2. DEFICIT CASE (Load > Solar)
    else {
      let deficit = Math.abs(netPower);
      let dischargeDecision = false;
      let gridChargeDecision = false;

      // --- STRATEGY: ARBITRAGE (SMART) ---
      if (params.strategy === SystemStrategy.Arbitrage && !isImportBlocked) {
        
        // A. SHOULD WE CHARGE FROM GRID? (Buy Low)
        // ----------------------------------------------------
        // Logic Upgrade: Solar Displacement Check
        // We must calculate if future solar is abundant. If it is, charging from grid 
        // effectively replaces free solar with paid grid energy -> Bad Idea.
        // ----------------------------------------------------
        
        let futureSolarSurplusMWh = 0;
        // Scan forward to see how much free charging power we expect
        for (let t = hour + 1; t < 24; t++) {
           const d = dayVector[t];
           if (d.solar > d.load) {
              // This is net energy available to charge the battery
              futureSolarSurplusMWh += (d.solar - d.load);
           }
        }
        
        const spaceInBattery = SOC_MAX_MWh - currentEnergyMWh;
        const willCurtailSolar = futureSolarSurplusMWh > (spaceInBattery * 0.9); // Buffer 10%

        // Profit Check: Sell Price must be significantly higher than Buy Price / Efficiency
        const profitableSpread = (maxPrice * BATTERY_EFFICIENCY) > vec.tariff;
        const isCheap = vec.tariff <= lowPriceThreshold;
        
        // Only charge if:
        // 1. Cheap
        // 2. Profitable
        // 3. We are NOT going to waste future solar (Crucial for Baseline parity)
        // 4. We aren't already full
        if (isCheap && profitableSpread && !willCurtailSolar && currentSocPercent < 0.9) {
           
           // Look-ahead: How much deficit is coming in the peak window?
           const upcomingPeakStart = peakHours.find(h => h > hour);
           if (upcomingPeakStart !== undefined) {
             let expectedPeakDeficit = 0;
             let expectedSolarGainBeforePeak = 0;
             
             // Scan from now until end of peak
             for (let t = hour; t < 24; t++) {
               if (dayVector[t].tariff >= highPriceThreshold) {
                 expectedPeakDeficit += Math.max(0, dayVector[t].load - dayVector[t].solar);
               }
               // Also count solar gain before the peak arrives
               if (t < upcomingPeakStart && dayVector[t].solar > dayVector[t].load) {
                  expectedSolarGainBeforePeak += (dayVector[t].solar - dayVector[t].load);
               }
             }

             // Dynamic Target: We need enough to cover peak, minus what solar will give us
             const energyNeed = Math.max(0, expectedPeakDeficit - expectedSolarGainBeforePeak);
             const currentAvailable = (currentEnergyMWh - SOC_MIN_MWh);
             
             // Only buy what we strictly need to survive the peak
             if (currentAvailable < energyNeed) {
                gridChargeDecision = true;
             }
           }
        }

        // B. SHOULD WE DISCHARGE? (Sell High / Offset)
        // Rules:
        // 1. Price is High (Top 25%) -> Always Discharge
        // 2. Price is Moderate (> Avg) AND SoC is healthy -> Discharge
        // 3. Price is Low -> NEVER Discharge (Hold)
        const isHighPrice = vec.tariff >= highPriceThreshold;
        const isModeratePrice = vec.tariff > avgPrice;
        
        if (isHighPrice) {
          dischargeDecision = true;
          batteryReason = "Peak Discharge";
        } else if (isModeratePrice && currentSocPercent > 0.5) {
          dischargeDecision = true; 
          batteryReason = "Econ Discharge";
        } else {
          // HOLD logic (Conserve for peak)
          // Exception: If it's the end of the day (e.g., > 22:00) and we still have charge, dump it to save money
          if (hour > 21 && currentSocPercent > (params.minSocPercent/100)) {
             dischargeDecision = true;
             batteryReason = "End-Day Dump";
          } else {
             dischargeDecision = false;
             batteryReason = "Conserving";
          }
        }
      } 
      // --- STRATEGY: STANDARD (BASELINE) ---
      else {
        // Simple logic: Discharge whenever there is a deficit
        dischargeDecision = true;
        batteryReason = "Load Following";
      }

      // EXECUTE DECISIONS
      
      // 1. Grid Charging Execution
      if (gridChargeDecision && !isImportBlocked && params.strategy === SystemStrategy.Arbitrage) {
         const space = SOC_MAX_MWh - currentEnergyMWh;
         // Charge as much as possible, limited by grid and inverter
         const chargeAmount = Math.min(effectiveGridLimit, realTimeMaxChargeMW, space / BATTERY_EFFICIENCY);
         if (chargeAmount > 0) {
           batteryFlowMW = -chargeAmount;
           currentEnergyMWh += (chargeAmount * BATTERY_EFFICIENCY);
           gridImportMW += chargeAmount;
           batteryReason = "Econ Charge";
           deficit = 0; // We are importing, not meeting deficit from battery
         }
      }

      // 2. Battery Discharging Execution
      if (dischargeDecision && batteryFlowMW === 0) { // Only if not already charging
        const availableEnergy = Math.max(0, currentEnergyMWh - SOC_MIN_MWh);
        // Discharge to meet deficit
        const dischargeAmount = Math.min(deficit, realTimeMaxDischargeMW, availableEnergy * BATTERY_EFFICIENCY);
        
        if (dischargeAmount > 0) {
          batteryFlowMW = dischargeAmount;
          currentEnergyMWh -= (dischargeAmount / BATTERY_EFFICIENCY);
          deficit -= dischargeAmount; // Reduce deficit
        }
      }

      // 3. Meet remaining deficit with Grid
      if (deficit > 0 && !isImportBlocked) {
        const importAmount = Math.min(deficit, effectiveGridLimit);
        gridImportMW += importAmount;
        deficit -= importAmount;
      }

      // 4. Meet remaining deficit with Diesel (Last Resort)
      if (deficit > 0) {
        dieselMW = Math.min(deficit, params.dieselCapacityMW);
        deficit -= dieselMW;
        batteryReason = deficit > 0 ? "Critical Deficit" : "Aux Support";
      }
    }

    // --- MARKET EXPORT CHECK (Arbitrage Only) ---
    // If battery is idle or discharging, and price is super high, and we have excess capacity + export allowed
    if (params.strategy === SystemStrategy.Arbitrage && params.allowBatteryExport && !isExportBlocked && !isImportBlocked) {
       if (vec.tariff >= highPriceThreshold && batteryFlowMW >= 0) {
         // How much more can we discharge?
         const remainingInverterHeadroom = params.maxDischargeRateMW - batteryFlowMW;
         const availableEnergy = Math.max(0, currentEnergyMWh - SOC_MIN_MWh);
         
         // Only export if we have significant energy (> 40%) to avoid depleting for local load
         if (remainingInverterHeadroom > 0 && currentSocPercent > 0.4) {
           const potentialExport = Math.min(remainingInverterHeadroom, availableEnergy * BATTERY_EFFICIENCY);
           
           if (potentialExport > 0) {
             batteryFlowMW += potentialExport;
             currentEnergyMWh -= (potentialExport / BATTERY_EFFICIENCY);
             gridExportMW += potentialExport;
             batteryReason = "Market Export";
           }
         }
       }
    }

    // --- FINAL ACCOUNTING ---
    if (gridImportMW > peakGridMW) peakGridMW = gridImportMW;

    // Financials
    const costGridOnly = isImportBlocked ? 0 : (vec.load * 1000 * vec.tariff);
    const activeExportPrice = params.feedInTariffINR;
    
    // Cost Components
    const importCost = gridImportMW * 1000 * vec.tariff;
    const exportRevenue = gridExportMW * 1000 * activeExportPrice;
    const dieselCost = dieselMW * 1000 * params.dieselFuelCostINR;

    totals.billGridOnly += costGridOnly;
    totals.billMicrogrid += importCost;
    totals.revenueSold += exportRevenue;
    totals.costDiesel += dieselCost;
    
    totals.load += vec.load;
    totals.solar += vec.solar;
    totals.gridImport += gridImportMW;
    totals.gridExport += gridExportMW;
    totals.diesel += dieselMW;
    if (batteryFlowMW > 0) totals.battDischarge += batteryFlowMW;

    const hourlyNetSavings = costGridOnly - (importCost + dieselCost - exportRevenue);

    hourlyData.push({
      hour, 
      baseLoadMW: HOURLY_LOAD_BASELINE[hour], 
      adjustedLoadMW: vec.load, 
      solarMW: vec.solar,
      netLoadMW: netPower, 
      gridImportMW, 
      gridExportMW, 
      dieselMW,
      batteryFlowMW, 
      socStatePercent: Math.max(0, (currentEnergyMWh / params.batteryCapacityMWh) * 100),
      priceINR: vec.tariff, 
      costGridOnly, 
      costMicrogrid: importCost, 
      revenueSoldINR: exportRevenue, 
      costDieselINR: dieselCost,
      netSavingsINR: hourlyNetSavings,
      isManualOverride: loadOverrides[hour] !== undefined, 
      batteryReason
    });
  }

  // --- RESULT AGGREGATION ---
  const netSavings = totals.billGridOnly - (totals.billMicrogrid + totals.costDiesel - totals.revenueSold);
  
  return { 
    data: hourlyData, 
    peakGridMW,
    audit: {
      totalBillGridOnly: totals.billGridOnly, 
      totalBillMicrogrid: totals.billMicrogrid,
      totalRevenueINR: totals.revenueSold, 
      totalDieselCostINR: totals.costDiesel,
      netSavingsINR: netSavings, 
      savingsPercent: totals.billGridOnly > 0 ? (netSavings / totals.billGridOnly) * 100 : 0,
      totalLoadMWh: totals.load, 
      totalSolarMWh: totals.solar, 
      totalGridImportMWh: totals.gridImport,
      totalGridExportMWh: totals.gridExport, 
      totalDieselMWh: totals.diesel, 
      totalBatteryDischargeMWh: totals.battDischarge,
      // Placeholders
      baselineNetCost: 0, actualNetCost: 0, arbitrageSavings: 0, arbitrageSavingsPercent: 0,
      baselineGridImportMWh: 0, baselineDieselMWh: 0, baselineBatteryCycles: 0, baselinePeakGridMW: 0,
      actualBatteryCycles: 0, actualPeakGridMW: 0,
      // Default Baselines
      baselineBillMicrogrid: 0, baselineRevenueINR: 0, baselineDieselCostINR: 0
    }, 
    endSocPercent: (currentEnergyMWh / params.batteryCapacityMWh) 
  };
};

export const runSimulation = (params: SimulationParams, loadOverrides: LoadOverride, tariffOverrides: TariffOverride = {}): SimulationResult => {
  // 1. Run Actual Simulation (Optimized Arbitrage or User Selection)
  const actualResult = simulateDay(params, loadOverrides, tariffOverrides, 0.5);

  // 2. Run Baseline Simulation (Standard Mode, No Arbitrage)
  // We force Standard strategy to get the "Dumb" baseline for comparison
  const baselineParams = { ...params, strategy: SystemStrategy.Standard };
  const baselineResult = simulateDay(baselineParams, loadOverrides, tariffOverrides, 0.5);

  // 3. Calculate Deltas
  const actualCost = actualResult.audit.totalBillMicrogrid + actualResult.audit.totalDieselCostINR;
  const baselineCost = baselineResult.audit.totalBillMicrogrid + baselineResult.audit.totalDieselCostINR;
  
  const arbitrageSavings = baselineCost - actualCost;
  const arbitrageSavingsPercent = Math.abs(baselineCost) > 0 ? (arbitrageSavings / Math.abs(baselineCost)) * 100 : 0;

  actualResult.audit.baselineNetCost = baselineCost;
  actualResult.audit.actualNetCost = actualCost;
  actualResult.audit.arbitrageSavings = arbitrageSavings;
  actualResult.audit.arbitrageSavingsPercent = arbitrageSavingsPercent;

  actualResult.audit.baselineGridImportMWh = baselineResult.audit.totalGridImportMWh;
  actualResult.audit.baselineDieselMWh = baselineResult.audit.totalDieselMWh;
  actualResult.audit.baselinePeakGridMW = baselineResult.peakGridMW;
  actualResult.audit.baselineBatteryCycles = baselineResult.audit.totalBatteryDischargeMWh / params.batteryCapacityMWh;
  
  actualResult.audit.actualPeakGridMW = actualResult.peakGridMW;
  actualResult.audit.actualBatteryCycles = actualResult.audit.totalBatteryDischargeMWh / params.batteryCapacityMWh;

  // New Detailed Baselines for UI
  actualResult.audit.baselineBillMicrogrid = baselineResult.audit.totalBillMicrogrid;
  actualResult.audit.baselineRevenueINR = baselineResult.audit.totalRevenueINR;
  actualResult.audit.baselineDieselCostINR = baselineResult.audit.totalDieselCostINR;

  return { hourlyData: actualResult.data, audit: actualResult.audit };
};