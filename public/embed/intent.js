/**
 * Predikt Intent Embed Script
 * Embeds trading intent status in external websites
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    baseUrl: 'https://predikt.fi', // Will be overridden by data-base-url
    version: '1.0.0',
    defaultTheme: 'light'
  };

  // Embed class
  class PrediktIntentEmbed {
    constructor(element, options = {}) {
      this.element = element;
      this.options = {
        intentId: element.dataset.intentId,
        baseUrl: element.dataset.baseUrl || CONFIG.baseUrl,
        theme: element.dataset.theme || CONFIG.defaultTheme,
        compact: element.dataset.compact === 'true',
        ...options
      };
      
      this.shadowRoot = null;
      this.loading = false;
      this.data = null;
      this.error = null;
      
      this.init();
    }

    init() {
      try {
        // Create shadow DOM for isolation
        this.shadowRoot = this.element.attachShadow({ mode: 'open' });
        
        // Load intent data
        this.loadIntentData();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
        
      } catch (error) {
        console.error('Predikt Intent Embed initialization failed:', error);
        this.showError('Failed to initialize embed');
      }
    }

    async loadIntentData() {
      if (this.loading) return;
      
      this.loading = true;
      this.showLoading();
      
      try {
        const response = await fetch(`${this.options.baseUrl}/api/public/intents/${this.options.intentId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': `Predikt-Embed/${CONFIG.version}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        this.data = await response.json();
        this.error = null;
        this.render();
        
      } catch (error) {
        console.error('Failed to load intent data:', error);
        this.error = error.message;
        this.showError(this.error);
      } finally {
        this.loading = false;
      }
    }

    setupAutoRefresh() {
      // Refresh every 30 seconds
      setInterval(() => {
        this.loadIntentData();
      }, 30000);
    }

    showLoading() {
      this.shadowRoot.innerHTML = `
        <div style="${this.getBaseStyles()}">
          <div style="display: flex; align-items: center; gap: 8px; padding: 12px;">
            <div style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="color: #6b7280; font-size: 14px;">Loading...</span>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }

    showError(message) {
      this.shadowRoot.innerHTML = `
        <div style="${this.getBaseStyles()}">
          <div style="padding: 12px; color: #dc2626; font-size: 14px;">
            ⚠️ ${message}
          </div>
        </div>
      `;
    }

    render() {
      if (!this.data) return;
      
      const { intent, latestReceipt } = this.data;
      
      if (this.options.compact) {
        this.renderCompact(intent, latestReceipt);
      } else {
        this.renderFull(intent, latestReceipt);
      }
    }

    renderCompact(intent, receipt) {
      const statusColor = this.getStatusColor(receipt?.status);
      const statusIcon = this.getStatusIcon(receipt?.status);
      
      this.shadowRoot.innerHTML = `
        <div style="${this.getBaseStyles()}">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; border: 1px solid ${statusColor.border}; background: ${statusColor.bg}; color: ${statusColor.text}; font-size: 14px; font-weight: 500;">
            <span>${statusIcon}</span>
            <span>${intent.side} ${intent.sizeJson.value}% ${intent.base}/${intent.quote}</span>
            <span style="font-size: 12px; opacity: 0.8;">${this.formatDate(intent.createdAt)}</span>
          </div>
        </div>
      `;
    }

    renderFull(intent, receipt) {
      const statusColor = this.getStatusColor(receipt?.status);
      const statusIcon = this.getStatusIcon(receipt?.status);
      
      this.shadowRoot.innerHTML = `
        <div style="${this.getBaseStyles()}">
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: white; max-width: 320px;">
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="padding: 4px 8px; border-radius: 4px; border: 1px solid ${statusColor.border}; background: ${statusColor.bg}; color: ${statusColor.text}; font-size: 12px; font-weight: 500;">
                  ${statusIcon} ${receipt?.status || 'Created'}
                </span>
                <span style="padding: 2px 6px; border-radius: 4px; background: ${intent.side === 'BUY' ? '#dcfce7' : '#fee2e2'}; color: ${intent.side === 'BUY' ? '#166534' : '#991b1b'}; font-size: 12px; font-weight: 500;">
                  ${intent.side}
                </span>
              </div>
            </div>
            
            <!-- Trade Details -->
            <div style="margin-bottom: 12px;">
              <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                ${intent.sizeJson.value}% ${intent.base}/${intent.quote}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                ${this.formatDate(intent.createdAt)}
              </div>
            </div>
            
            <!-- Execution Details -->
            ${receipt && receipt.status === 'executed' ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                ${receipt.realizedPx ? `
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: #6b7280;">Price</span>
                    <span style="color: #111827; font-weight: 500;">$${receipt.realizedPx.toFixed(2)}</span>
                  </div>
                ` : ''}
                ${receipt.feesUsd ? `
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: #6b7280;">Fees</span>
                    <span style="color: #111827; font-weight: 500;">$${receipt.feesUsd.toFixed(4)}</span>
                  </div>
                ` : ''}
                ${receipt.slippageBps ? `
                  <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span style="color: #6b7280;">Slippage</span>
                    <span style="color: #111827; font-weight: 500;">${receipt.slippageBps} bps</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <!-- Transaction Hash -->
            ${receipt?.txSig ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Transaction</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <code style="font-size: 11px; font-family: monospace; background: #f3f4f6; padding: 4px 6px; border-radius: 4px; color: #111827;">
                    ${receipt.txSig}
                  </code>
                  <a href="https://solscan.io/tx/${receipt.txSig}" target="_blank" style="font-size: 11px; color: #3b82f6; text-decoration: none;">
                    View
                  </a>
                </div>
              </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af;">
              <span>Powered by Predikt</span>
              <span>Jupiter</span>
            </div>
          </div>
        </div>
      `;
    }

    getStatusColor(status) {
      switch (status) {
        case 'executed':
          return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
        case 'simulated':
          return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
        case 'failed':
          return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
        default:
          return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
      }
    }

    getStatusIcon(status) {
      switch (status) {
        case 'executed': return '✓';
        case 'simulated': return '📊';
        case 'failed': return '✗';
        default: return '?';
      }
    }

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    getBaseStyles() {
      return `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #111827;
        box-sizing: border-box;
      `;
    }
  }

  // Auto-initialize embeds
  function initializeEmbeds() {
    const elements = document.querySelectorAll('[data-predikt-intent]');
    elements.forEach(element => {
      if (!element.prediktEmbed) {
        element.prediktEmbed = new PrediktIntentEmbed(element);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEmbeds);
  } else {
    initializeEmbeds();
  }

  // Re-initialize on dynamic content changes
  const observer = new MutationObserver(() => {
    initializeEmbeds();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Export for manual initialization
  window.PrediktIntentEmbed = PrediktIntentEmbed;

})();
