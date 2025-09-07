/**
 * Kill-switch functionality for Actions
 * Allows emergency shutdown of trading operations
 */

interface KillSwitchConfig {
  enabled: boolean;
  reason?: string;
  activatedAt?: Date;
  activatedBy?: string;
  scope: 'all' | 'execute' | 'simulate' | 'create';
}

interface KillSwitchStatus {
  isActive: boolean;
  config: KillSwitchConfig;
  uptime: number;
  lastCheck: Date;
}

export class KillSwitchService {
  private config: KillSwitchConfig = {
    enabled: false,
    scope: 'all'
  };
  private startTime = Date.now();
  private lastCheck = new Date();

  /**
   * Check if kill switch is active for a specific operation
   */
  isKillSwitchActive(operation: 'create' | 'simulate' | 'execute'): boolean {
    this.lastCheck = new Date();
    
    if (!this.config.enabled) {
      return false;
    }

    // Check scope
    if (this.config.scope === 'all') {
      return true;
    }

    return this.config.scope === operation;
  }

  /**
   * Activate kill switch
   */
  activate(
    reason: string,
    scope: 'all' | 'execute' | 'simulate' | 'create' = 'all',
    activatedBy: string = 'system'
  ): void {
    this.config = {
      enabled: true,
      reason,
      scope,
      activatedAt: new Date(),
      activatedBy
    };

    console.error('🚨 KILL SWITCH ACTIVATED:', {
      reason,
      scope,
      activatedBy,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Deactivate kill switch
   */
  deactivate(deactivatedBy: string = 'system'): void {
    this.config = {
      enabled: false,
      scope: 'all'
    };

    console.log('✅ KILL SWITCH DEACTIVATED:', {
      deactivatedBy,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current status
   */
  getStatus(): KillSwitchStatus {
    return {
      isActive: this.config.enabled,
      config: this.config,
      uptime: Date.now() - this.startTime,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Check kill switch before operation
   */
  checkBeforeOperation(operation: 'create' | 'simulate' | 'execute'): {
    allowed: boolean;
    reason?: string;
  } {
    if (this.isKillSwitchActive(operation)) {
      return {
        allowed: false,
        reason: this.config.reason || 'Kill switch is active'
      };
    }

    return { allowed: true };
  }

  /**
   * Emergency shutdown (for critical issues)
   */
  emergencyShutdown(reason: string, activatedBy: string = 'emergency'): void {
    this.activate(`EMERGENCY: ${reason}`, 'all', activatedBy);
    
    // Log to all available channels
    console.error('🚨 EMERGENCY SHUTDOWN:', {
      reason,
      activatedBy,
      timestamp: new Date().toISOString(),
      config: this.config
    });

    // In production, this would also:
    // - Send alerts to admin team
    // - Log to external monitoring systems
    // - Potentially notify users
  }

  /**
   * Health check for kill switch
   */
  healthCheck(): {
    healthy: boolean;
    status: KillSwitchStatus;
    issues: string[];
  } {
    const issues: string[] = [];
    const status = this.getStatus();

    // Check if kill switch has been active for too long
    if (status.isActive && status.config.activatedAt) {
      const activeDuration = Date.now() - status.config.activatedAt.getTime();
      const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (activeDuration > maxDuration) {
        issues.push('Kill switch has been active for over 24 hours');
      }
    }

    // Check if last check was too long ago
    const timeSinceLastCheck = Date.now() - status.lastCheck.getTime();
    const maxCheckInterval = 5 * 60 * 1000; // 5 minutes
    
    if (timeSinceLastCheck > maxCheckInterval) {
      issues.push('Kill switch health check overdue');
    }

    return {
      healthy: issues.length === 0,
      status,
      issues
    };
  }

  /**
   * Get kill switch configuration for UI
   */
  getUIConfig(): {
    isActive: boolean;
    reason?: string;
    scope: string;
    activatedAt?: string;
    canDeactivate: boolean;
  } {
    return {
      isActive: this.config.enabled,
      reason: this.config.reason,
      scope: this.config.scope,
      activatedAt: this.config.activatedAt?.toISOString(),
      canDeactivate: this.config.enabled && this.config.scope !== 'all'
    };
  }
}

// Singleton instance
export const killSwitchService = new KillSwitchService();

// Export types
export type { KillSwitchConfig, KillSwitchStatus };
