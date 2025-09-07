// app/lib/advisor/risk.ts
import { prisma } from '../prisma';
import { PortfolioSnapshot } from './holdings';

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  recommendations: RiskRecommendation[];
}

export interface RiskFactor {
  type: 'concentration' | 'volatility' | 'liquidity' | 'correlation' | 'leverage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
}

export interface RiskRecommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
  description: string;
  expectedImpact: string;
}

export class RiskAnalyzer {
  static analyzePortfolioRisk(snapshot: PortfolioSnapshot): RiskAssessment {
    const riskFactors: RiskFactor[] = [];
    const recommendations: RiskRecommendation[] = [];
    
    // Analyze concentration risk
    this.analyzeConcentrationRisk(snapshot, riskFactors, recommendations);
    
    // Analyze diversification
    this.analyzeDiversificationRisk(snapshot, riskFactors, recommendations);
    
    // Analyze stablecoin exposure
    this.analyzeStablecoinRisk(snapshot, riskFactors, recommendations);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors);
    const overallRisk = this.determineOverallRisk(riskScore);
    
    return {
      overallRisk,
      riskScore,
      riskFactors,
      recommendations
    };
  }

  private static analyzeConcentrationRisk(
    snapshot: PortfolioSnapshot,
    riskFactors: RiskFactor[],
    recommendations: RiskRecommendation[]
  ): void {
    const { concentration } = snapshot;
    
    // Check top position concentration
    if (concentration.top5Percent > 80) {
      riskFactors.push({
        type: 'concentration',
        severity: 'critical',
        description: `Top 5 positions represent ${concentration.top5Percent.toFixed(1)}% of portfolio`,
        impact: 'High concentration increases portfolio volatility and single-point-of-failure risk',
        mitigation: 'Consider diversifying across more assets'
      });
      
      recommendations.push({
        priority: 'high',
        action: 'Diversify portfolio',
        description: 'Reduce concentration in top positions by adding more assets',
        expectedImpact: 'Lower portfolio volatility and risk'
      });
    } else if (concentration.top5Percent > 60) {
      riskFactors.push({
        type: 'concentration',
        severity: 'high',
        description: `Top 5 positions represent ${concentration.top5Percent.toFixed(1)}% of portfolio`,
        impact: 'Moderate concentration risk',
        mitigation: 'Monitor and consider gradual diversification'
      });
    }
    
    // Check HHI (Herfindahl-Hirschman Index)
    if (concentration.hhi > 0.25) {
      riskFactors.push({
        type: 'concentration',
        severity: 'high',
        description: `Portfolio concentration index (HHI) is ${concentration.hhi.toFixed(3)}`,
        impact: 'High concentration indicates lack of diversification',
        mitigation: 'Increase number of holdings and reduce position sizes'
      });
    }
  }

  private static analyzeDiversificationRisk(
    snapshot: PortfolioSnapshot,
    riskFactors: RiskFactor[],
    recommendations: RiskRecommendation[]
  ): void {
    const { risk } = snapshot;
    
    if (risk.diversification === 'low') {
      riskFactors.push({
        type: 'correlation',
        severity: 'high',
        description: 'Low portfolio diversification',
        impact: 'Assets may move together, increasing overall risk',
        mitigation: 'Add uncorrelated assets to reduce portfolio risk'
      });
      
      recommendations.push({
        priority: 'medium',
        action: 'Improve diversification',
        description: 'Add assets from different sectors or asset classes',
        expectedImpact: 'Reduced correlation risk and improved risk-adjusted returns'
      });
    }
  }

  private static analyzeStablecoinRisk(
    snapshot: PortfolioSnapshot,
    riskFactors: RiskFactor[],
    recommendations: RiskRecommendation[]
  ): void {
    const { concentration } = snapshot;
    
    // Check stablecoin depeg risk
    if (concentration.stablecoinPercent > 50) {
      riskFactors.push({
        type: 'liquidity',
        severity: 'medium',
        description: `${concentration.stablecoinPercent.toFixed(1)}% of portfolio in stablecoins`,
        impact: 'High stablecoin exposure creates depeg risk',
        mitigation: 'Monitor stablecoin health and consider diversification'
      });
    }
    
    // Check if too little stablecoin exposure
    if (concentration.stablecoinPercent < 5 && snapshot.totalValueUsd > 10000) {
      riskFactors.push({
        type: 'volatility',
        severity: 'medium',
        description: 'Low stablecoin exposure for portfolio size',
        impact: 'Limited downside protection during market stress',
        mitigation: 'Consider adding stablecoin allocation for risk management'
      });
      
      recommendations.push({
        priority: 'low',
        action: 'Add stablecoin allocation',
        description: 'Consider adding 5-10% stablecoin allocation for risk management',
        expectedImpact: 'Better downside protection during market volatility'
      });
    }
  }

  private static calculateRiskScore(riskFactors: RiskFactor[]): number {
    let score = 0;
    
    riskFactors.forEach(factor => {
      switch (factor.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    });
    
    return Math.min(100, score);
  }

  private static determineOverallRisk(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  // Generate risk alerts based on portfolio changes
  static generateRiskAlerts(
    currentSnapshot: PortfolioSnapshot,
    previousSnapshot?: PortfolioSnapshot
  ): string[] {
    const alerts: string[] = [];
    
    if (!previousSnapshot) {
      return alerts;
    }
    
    // Check for significant concentration changes
    const concentrationChange = Math.abs(
      currentSnapshot.concentration.top5Percent - previousSnapshot.concentration.top5Percent
    );
    
    if (concentrationChange > 10) {
      alerts.push(
        `Portfolio concentration changed by ${concentrationChange.toFixed(1)}% - ` +
        `Top 5 positions now represent ${currentSnapshot.concentration.top5Percent.toFixed(1)}%`
      );
    }
    
    // Check for significant value changes
    const valueChange = (currentSnapshot.totalValueUsd - previousSnapshot.totalValueUsd) / 
                       previousSnapshot.totalValueUsd * 100;
    
    if (Math.abs(valueChange) > 20) {
      alerts.push(
        `Portfolio value changed by ${valueChange.toFixed(1)}% - ` +
        `From $${previousSnapshot.totalValueUsd.toFixed(2)} to $${currentSnapshot.totalValueUsd.toFixed(2)}`
      );
    }
    
    return alerts;
  }
}
