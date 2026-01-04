/**
 * Talent AI Insights Engine
 * Generates explainable, rule-based insights for talent seeking opportunities
 */

import { Startup, Profile, STAGE_LABELS } from '@/types/database';
import { calculateSkillGap, talentFillsSkillGap, SkillGapAnalysis } from '@/lib/skillGap';
import {
  AIInsight,
  TalentInsights,
  getConfidenceLevel,
} from './types';

// Stage alignment scoring
const STAGE_APPEAL: Record<string, string> = {
  idea: 'Early-stage opportunity to shape the product vision from scratch',
  mvp: 'Hands-on building phase with direct product impact',
  early_stage: 'Growth-focused environment with expanding responsibilities',
  growth: 'Scaling challenges with structured processes',
  scaling: 'Enterprise-level operations with established systems',
};

/**
 * Calculate overall fit score between talent and startup
 */
function calculateFitScore(
  talentSkills: string[],
  startup: Startup,
  skillGap: SkillGapAnalysis,
  matchScore?: number
): number {
  const { missingSkills } = skillGap;
  
  // Base score from match (if available)
  let score = matchScore || 50;
  
  // Boost for filling skill gaps
  const { fills, matchedSkills } = talentFillsSkillGap(talentSkills, startup);
  if (fills) {
    score += matchedSkills.length * 10; // +10 per matched skill
  }
  
  // Boost for having multiple relevant skills
  const relevantSkillCount = talentSkills.filter(skill =>
    skillGap.requiredSkills.some(req => 
      req.toLowerCase() === skill.toLowerCase()
    )
  ).length;
  score += relevantSkillCount * 5;
  
  return Math.min(100, score);
}

/**
 * Generate fit summary insight
 */
function generateFitSummary(
  talent: Profile,
  startup: Startup,
  skillGap: SkillGapAnalysis,
  matchScore?: number
): AIInsight {
  const talentSkills = talent.skills || [];
  const { fills, matchedSkills } = talentFillsSkillGap(talentSkills, startup);
  const fitScore = calculateFitScore(talentSkills, startup, skillGap, matchScore);
  const stageLabel = STAGE_LABELS[startup.stage];
  
  let summary: string;
  let reasoning: string[] = [];
  
  if (fills && matchedSkills.length > 0) {
    const skillsList = matchedSkills.slice(0, 2).join(' and ');
    summary = `This startup is looking for ${skillsList} — skills that match your profile. You could fill a critical team gap.`;
    reasoning.push(`Your ${skillsList} skills align with their current needs`);
    reasoning.push(`The team is missing ${skillGap.missingSkills.length} key skill area(s)`);
  } else if (fitScore >= 60) {
    summary = `Your profile shows good alignment with this ${stageLabel} startup. Consider exploring this opportunity.`;
    reasoning.push(`General skill relevance detected for their stage`);
  } else {
    summary = `This ${stageLabel} startup may offer learning opportunities, though your current skills don't directly match their gaps.`;
    reasoning.push('This could be a growth opportunity to develop new skills');
  }
  
  // Add stage context
  const stageAppeal = STAGE_APPEAL[startup.stage];
  if (stageAppeal) {
    reasoning.push(stageAppeal);
  }
  
  // Add industry context
  reasoning.push(`Operating in the ${startup.industry} industry`);
  
  return {
    id: 'fit-summary',
    title: 'Opportunity Fit',
    summary,
    reasoning,
    confidence: getConfidenceLevel(fitScore),
    category: 'fit',
    icon: 'sparkles',
  };
}

/**
 * Generate "why you're a good fit" bullet points
 */
function generateWhyGoodFit(
  talent: Profile,
  startup: Startup,
  skillGap: SkillGapAnalysis
): string[] {
  const reasons: string[] = [];
  const talentSkills = talent.skills || [];
  const { fills, matchedSkills } = talentFillsSkillGap(talentSkills, startup);
  
  // Skill overlap
  if (fills && matchedSkills.length > 0) {
    reasons.push(`Your ${matchedSkills.join(', ')} skills match their team needs`);
  }
  
  // Gap coverage
  if (fills) {
    reasons.push(`You could help fill ${matchedSkills.length} skill gap(s) on their team`);
  }
  
  // Stage alignment
  const stageAppeal = STAGE_APPEAL[startup.stage];
  if (stageAppeal) {
    reasons.push(stageAppeal);
  }
  
  // Team completion impact
  if (skillGap.completionPercentage < 80) {
    reasons.push('Joining could significantly improve their team readiness');
  }
  
  // Industry match (if talent has related skills)
  const industryRelated = talentSkills.some(skill => 
    startup.industry.toLowerCase().includes(skill.toLowerCase()) ||
    skill.toLowerCase().includes(startup.industry.toLowerCase())
  );
  if (industryRelated) {
    reasons.push(`Your background aligns with their ${startup.industry} focus`);
  }
  
  // Fallback if no strong reasons
  if (reasons.length === 0) {
    reasons.push('This could be an opportunity to expand your skill set');
    reasons.push(`${STAGE_LABELS[startup.stage]} startups offer unique learning experiences`);
  }
  
  return reasons.slice(0, 4); // Max 4 reasons
}

/**
 * Generate impact prediction insight
 */
function generateImpactPrediction(
  talent: Profile,
  startup: Startup,
  skillGap: SkillGapAnalysis
): AIInsight {
  const talentSkills = talent.skills || [];
  const { fills, matchedSkills } = talentFillsSkillGap(talentSkills, startup);
  const { completionPercentage, missingSkills } = skillGap;
  
  // Calculate projected completion with this talent
  const coveredByTalent = matchedSkills.length;
  const totalRequired = skillGap.requiredSkills.length;
  const currentCovered = totalRequired - missingSkills.length;
  const projectedCovered = Math.min(totalRequired, currentCovered + coveredByTalent);
  const projectedPercentage = totalRequired > 0 
    ? Math.round((projectedCovered / totalRequired) * 100)
    : 100;
  
  let summary: string;
  let reasoning: string[] = [];
  
  if (fills && projectedPercentage > completionPercentage) {
    summary = `Joining could improve team completeness from ${completionPercentage}% to ${projectedPercentage}%.`;
    reasoning.push(`Your skills would cover ${coveredByTalent} of their ${missingSkills.length} gap(s)`);
    reasoning.push('This suggests meaningful contribution potential');
  } else if (fills) {
    summary = `Your skills align with their needs, suggesting strong contribution potential.`;
    reasoning.push('You match skills they\'re actively seeking');
    reasoning.push('Early team members often have outsized impact');
  } else {
    summary = `While not a direct skill match, you could bring fresh perspectives to the team.`;
    reasoning.push('Diverse skills can strengthen team dynamics');
    reasoning.push('This role might involve learning new technologies');
  }
  
  // Add stage-specific impact context
  const stageLabel = STAGE_LABELS[startup.stage];
  reasoning.push(`At the ${stageLabel} stage, individual contributions are highly visible`);
  
  return {
    id: 'impact-prediction',
    title: 'Potential Impact',
    summary,
    reasoning,
    confidence: fills ? getConfidenceLevel(70) : getConfidenceLevel(40),
    category: 'impact',
    icon: 'trending',
  };
}

/**
 * Main function: Generate all talent insights for a startup
 */
export function generateTalentInsights(
  talent: Profile,
  startup: Startup,
  matchScore?: number
): TalentInsights {
  // Calculate skill gap for the startup
  const skillGap = calculateSkillGap(startup);
  
  return {
    fitSummary: generateFitSummary(talent, startup, skillGap, matchScore),
    whyGoodFit: generateWhyGoodFit(talent, startup, skillGap),
    impactPrediction: generateImpactPrediction(talent, startup, skillGap),
  };
}

/**
 * Get a quick fit summary for startup cards
 */
export function getTalentQuickFit(
  talent: Profile,
  startup: Startup,
  matchScore?: number
): { label: string; fills: boolean; skills: string[] } {
  const { fills, matchedSkills } = talentFillsSkillGap(talent.skills || [], startup);
  
  if (fills && matchedSkills.length > 0) {
    return {
      label: `Matches ${matchedSkills.length} skill need${matchedSkills.length > 1 ? 's' : ''}`,
      fills: true,
      skills: matchedSkills,
    };
  }
  
  if (matchScore && matchScore >= 70) {
    return {
      label: 'Strong match',
      fills: false,
      skills: [],
    };
  }
  
  return {
    label: 'Explore opportunity',
    fills: false,
    skills: [],
  };
}
