/**
 * AI Module - Centralized exports for AI-assisted decision-making
 */

// Types
export type { 
  AIInsight, 
  FounderInsights, 
  TalentInsights, 
  InsightContext,
  ConfidenceLevel 
} from './types';

export { 
  getConfidenceLevel, 
  getConfidenceLabel,
  CONFIDENCE_THRESHOLDS 
} from './types';

// Founder Insights
export { 
  generateFounderInsights, 
  getFounderQuickSummary 
} from './founderInsights';

// Talent Insights
export { 
  generateTalentInsights, 
  getTalentQuickFit 
} from './talentInsights';
