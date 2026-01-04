/**
 * AI Insight Types
 * Core types for the AI-assisted decision-making system
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  reasoning: string[];
  confidence: ConfidenceLevel;
  category: 'health' | 'action' | 'priority' | 'fit' | 'impact';
  icon?: 'brain' | 'sparkles' | 'lightbulb' | 'target' | 'trending' | 'users';
}

export interface FounderInsights {
  healthSummary: AIInsight;
  nextActions: AIInsight[];
  hiringPriority: AIInsight | null;
}

export interface TalentInsights {
  fitSummary: AIInsight;
  whyGoodFit: string[];
  impactPrediction: AIInsight;
}

export interface InsightContext {
  stage: string;
  industry: string;
  founderSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  teamSkills: string[];
  completionPercentage: number;
  interestCount: number;
  matchScore?: number;
  talentSkills?: string[];
}

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  high: 70,
  medium: 40,
  low: 0,
} as const;

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Moderate confidence';
    case 'low':
      return 'Based on limited data';
  }
}
