import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ScoreTooltip from '../../app/components/ScoreTooltip';

describe('ScoreTooltip', () => {
  const defaultProps = {
    score: 0.85,
    accuracy: 0.92,
    totalInsights: 150,
    resolvedInsights: 120,
    averageBrier: 0.25,
    isProvisional: false
  };

  it('renders info icon', () => {
    render(<ScoreTooltip {...defaultProps} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    expect(infoIcon).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(<ScoreTooltip {...defaultProps} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    
    fireEvent.mouseEnter(infoIcon);
    
    expect(screen.getByText('Score Calculation')).toBeInTheDocument();
    expect(screen.getByText('Accuracy:')).toBeInTheDocument();
    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('Volume (insights):')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('shows provisional badge when isProvisional is true', () => {
    render(<ScoreTooltip {...defaultProps} isProvisional={true} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    
    fireEvent.mouseEnter(infoIcon);
    
    expect(screen.getByText('Provisional')).toBeInTheDocument();
  });

  it('calculates and displays correct score formula', () => {
    render(<ScoreTooltip {...defaultProps} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    
    fireEvent.mouseEnter(infoIcon);
    
    expect(screen.getByText('Score = (Accuracy × 0.4) + (Volume × 0.3) + (Consistency × 0.3)')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<ScoreTooltip {...defaultProps} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    
    fireEvent.mouseEnter(infoIcon);
    expect(screen.getByText('Score Calculation')).toBeInTheDocument();
    
    fireEvent.mouseLeave(infoIcon);
    expect(screen.queryByText('Score Calculation')).not.toBeInTheDocument();
  });

  it('toggles tooltip on click', () => {
    render(<ScoreTooltip {...defaultProps} />);
    const infoIcon = screen.getByLabelText('Score calculation details');
    
    fireEvent.click(infoIcon);
    expect(screen.getByText('Score Calculation')).toBeInTheDocument();
    
    fireEvent.click(infoIcon);
    expect(screen.queryByText('Score Calculation')).not.toBeInTheDocument();
  });
});
