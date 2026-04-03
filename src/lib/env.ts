/**
 * Smart Grid RL Environment
 * State: [demand, production, battery_level, time_of_day]
 * Actions: 0: Idle, 1: Charge, 2: Discharge
 */

export interface EnvState {
  demand: number;
  production: number;
  batteryLevel: number;
  timeOfDay: number; // 0-23
  step: number;
}

export class SmartGridEnv {
  private state: EnvState;
  private maxBattery = 100;
  private maxSteps = 24 * 7; // One week simulation

  constructor() {
    this.state = this.reset();
  }

  reset(): EnvState {
    this.state = {
      demand: this.getDemand(0),
      production: this.getProduction(0),
      batteryLevel: 50,
      timeOfDay: 0,
      step: 0,
    };
    return { ...this.state };
  }

  private getDemand(hour: number): number {
    // Typical daily demand curve: peaks at 8am and 7pm
    const base = 20;
    const peak1 = 40 * Math.exp(-Math.pow(hour - 8, 2) / 8);
    const peak2 = 50 * Math.exp(-Math.pow(hour - 19, 2) / 12);
    return base + peak1 + peak2 + (Math.random() * 5);
  }

  private getProduction(hour: number): number {
    // Solar production: peaks at noon
    if (hour < 6 || hour > 18) return Math.random() * 5;
    return 60 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() * 10);
  }

  step(action: number): { state: EnvState; reward: number; done: boolean } {
    const { demand, production, batteryLevel, timeOfDay, step } = this.state;
    let reward = 0;
    let newBattery = batteryLevel;

    // Action Logic
    if (action === 1) { // Charge
      const chargeAmount = Math.min(production, this.maxBattery - batteryLevel);
      newBattery += chargeAmount;
      reward += 2; // Small reward for storing energy
    } else if (action === 2) { // Discharge
      const dischargeAmount = Math.min(batteryLevel, demand);
      newBattery -= dischargeAmount;
      reward += 5; // Reward for using stored energy
    }

    // Energy Balance
    const netEnergy = (production + (action === 2 ? batteryLevel : 0)) - (demand + (action === 1 ? production : 0));
    
    // Penalties
    if (netEnergy < 0) {
      reward -= 50; // Blackout penalty
    } else if (netEnergy > 20) {
      reward -= 5; // Wasted energy penalty
    } else {
      reward += 10; // Stability reward
    }

    // Update State
    const nextHour = (timeOfDay + 1) % 24;
    this.state = {
      demand: this.getDemand(nextHour),
      production: this.getProduction(nextHour),
      batteryLevel: newBattery,
      timeOfDay: nextHour,
      step: step + 1,
    };

    const done = this.state.step >= this.maxSteps;
    return { state: { ...this.state }, reward, done };
  }
}
