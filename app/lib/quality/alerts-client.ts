'use client';

import { AccuracyAlert } from './monitoring';

export interface SlackAlert {
  text: string;
  attachments: {
    color: 'warning' | 'danger' | 'good';
    fields: {
      title: string;
      value: string;
      short: boolean;
    }[];
    footer: string;
    ts: number;
  }[];
}

/**
 * Get alert severity color for UI
 */
export function getAlertColor(severity: 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'warning':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
}

/**
 * Get alert icon for UI
 */
export function getAlertIcon(severity: 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    default:
      return 'ℹ️';
  }
}
