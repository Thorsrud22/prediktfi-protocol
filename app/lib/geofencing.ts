/**
 * Geofencing and Terms of Service acceptance
 * Enforces geographic restrictions and ToS acceptance for Actions
 */

interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
}

interface ToSAcceptance {
  userId: string;
  version: string;
  acceptedAt: Date;
  ipAddress: string;
  userAgent: string;
}

// Blocked countries/regions for Actions
const BLOCKED_COUNTRIES = [
  'US', // United States - strict regulations
  'CN', // China - crypto restrictions
  'IN', // India - uncertain regulatory environment
  'RU', // Russia - sanctions
  'IR', // Iran - sanctions
  'KP', // North Korea - sanctions
  'CU', // Cuba - sanctions
  'SY', // Syria - sanctions
];

// Blocked US states (if country is US)
const BLOCKED_US_STATES = [
  'NY', // New York - BitLicense required
  'TX', // Texas - strict regulations
  'CA', // California - complex regulations
];

export class GeofencingService {
  private tosAcceptances = new Map<string, ToSAcceptance>();
  private readonly currentToSVersion = '1.0.0';

  /**
   * Check if location is allowed for Actions
   */
  async checkLocationAllowed(ipAddress: string): Promise<{
    allowed: boolean;
    reason?: string;
    location?: GeoLocation;
  }> {
    try {
      // In production, use a real geolocation service
      // For now, we'll use a mock service
      const location = await this.getLocationFromIP(ipAddress);
      
      if (!location) {
        return { allowed: false, reason: 'Unable to determine location' };
      }

      // Check blocked countries
      if (BLOCKED_COUNTRIES.includes(location.country)) {
        return {
          allowed: false,
          reason: `Actions not available in ${location.country}`,
          location
        };
      }

      // Check blocked US states
      if (location.country === 'US' && location.region && BLOCKED_US_STATES.includes(location.region)) {
        return {
          allowed: false,
          reason: `Actions not available in ${location.region}, ${location.country}`,
          location
        };
      }

      return { allowed: true, location };
    } catch (error) {
      console.error('Geofencing check failed:', error);
      return { allowed: false, reason: 'Location check failed' };
    }
  }

  /**
   * Check if user has accepted current ToS
   */
  hasAcceptedToS(userId: string): boolean {
    const acceptance = this.tosAcceptances.get(userId);
    return acceptance?.version === this.currentToSVersion;
  }

  /**
   * Record ToS acceptance
   */
  recordToSAcceptance(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): void {
    this.tosAcceptances.set(userId, {
      userId,
      version: this.currentToSVersion,
      acceptedAt: new Date(),
      ipAddress,
      userAgent
    });
  }

  /**
   * Get ToS acceptance record
   */
  getToSAcceptance(userId: string): ToSAcceptance | null {
    return this.tosAcceptances.get(userId) || null;
  }

  /**
   * Check if Actions are allowed for user
   */
  async checkActionsAllowed(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiresToS?: boolean;
    location?: GeoLocation;
  }> {
    // Check geofencing
    const locationCheck = await this.checkLocationAllowed(ipAddress);
    if (!locationCheck.allowed) {
      return {
        allowed: false,
        reason: locationCheck.reason,
        location: locationCheck.location
      };
    }

    // Check ToS acceptance
    if (!this.hasAcceptedToS(userId)) {
      return {
        allowed: false,
        reason: 'Terms of Service not accepted',
        requiresToS: true,
        location: locationCheck.location
      };
    }

    return {
      allowed: true,
      location: locationCheck.location
    };
  }

  /**
   * Mock geolocation service (replace with real service in production)
   */
  private async getLocationFromIP(ipAddress: string): Promise<GeoLocation | null> {
    // Mock implementation - in production, use services like:
    // - ipapi.co
    // - ipinfo.io
    // - MaxMind GeoIP2
    
    // For localhost/development
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.')) {
      return {
        country: 'NO', // Norway for development
        region: 'OS',
        city: 'Oslo'
      };
    }

    // Mock some test cases
    const mockLocations: Record<string, GeoLocation> = {
      '8.8.8.8': { country: 'US', region: 'CA', city: 'Mountain View' },
      '1.1.1.1': { country: 'AU', region: 'NSW', city: 'Sydney' },
      '208.67.222.222': { country: 'US', region: 'NY', city: 'New York' },
    };

    return mockLocations[ipAddress] || {
      country: 'NO', // Default to Norway for unknown IPs
      region: 'OS',
      city: 'Oslo'
    };
  }

  /**
   * Get current ToS version
   */
  getCurrentToSVersion(): string {
    return this.currentToSVersion;
  }

  /**
   * Get ToS text
   */
  getToSText(): string {
    return `
# Terms of Service - Predikt Actions

## 1. Risk Acknowledgment
By using Predikt Actions, you acknowledge that:
- Cryptocurrency trading involves substantial risk of loss
- Past performance does not guarantee future results
- You may lose some or all of your invested capital
- Market conditions can change rapidly and unpredictably

## 2. No Financial Advice
- Predikt Actions is a tool for executing trades, not financial advice
- All trading decisions are your own responsibility
- You should consult with qualified financial advisors
- We are not registered investment advisors

## 3. Compliance
- You are responsible for compliance with local laws and regulations
- You must be of legal age in your jurisdiction
- You must not use the service for illegal activities
- You are responsible for tax obligations

## 4. Service Availability
- The service may be unavailable due to maintenance or technical issues
- We reserve the right to suspend or terminate access
- Geographic restrictions may apply
- We do not guarantee uninterrupted service

## 5. Limitation of Liability
- We provide the service "as is" without warranties
- We are not liable for trading losses
- Our liability is limited to the maximum extent permitted by law
- You use the service at your own risk

## 6. Acceptance
By clicking "Accept", you agree to these terms and conditions.

Version: ${this.currentToSVersion}
Effective Date: ${new Date().toISOString().split('T')[0]}
    `.trim();
  }
}

// Singleton instance
export const geofencingService = new GeofencingService();

// Export types
export type { GeoLocation, ToSAcceptance };
