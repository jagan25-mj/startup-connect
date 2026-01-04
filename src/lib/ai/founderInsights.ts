/**
 * Founder AI Insights Engine
 * Generates explainable, rule-based insights for startup founders
 */

import { Startup, STAGE_LABELS } from '@/types/database';
import { calculateSkillGap, SkillGapAnalysis, getPrioritySkills } from '@/lib/skillGap';
import {
  AIInsight,
  FounderInsights,
  InsightContext,
  getConfidenceLevel,
} from './types';

// Stage-specific messaging
const STAGE_GUIDANCE: Record<string, { focus: string; priorities: string[] }> = {
  idea: {
    focus: 'validating your concept and building initial traction',
    priorities: ['Product thinking', 'User research', 'Technical feasibility'],
  },
  mvp: {
    focus: 'shipping quickly and gathering early feedback',
    priorities: ['Frontend development', 'Backend development', 'User testing'],
  },
  early_stage: {
    focus: 'finding product-market fit and initial growth',
    priorities: ['Marketing', 'Sales', 'Customer success'],
  },
  growth: {
    focus: 'scaling operations and expanding your market',
    priorities: ['Operations', 'Data analysis', 'Team management'],
  },
  scaling: {
    focus: 'optimizing processes and building sustainable growth',
    priorities: ['Finance', 'Legal', 'Strategic partnerships'],
  },
};

/**
 * Generate startup health summary insight
 */
function generateHealthSummary(
  startup: Startup,
  skillGap: SkillGapAnalysis,
  interestCount: number
): AIInsight {
  const { completionPercentage, missingSkills, teamSkills } = skillGap;
  const stageLabel = STAGE_LABELS[startup.stage];
  
  let summary: string;
  let reasoning: string[] = [];
  
  // Build summary based on completion
  if (completionPercentage >= 80) {
    summary = `Your ${stageLabel} startup has strong skill coverage at ${completionPercentage}% team completeness. You're well-positioned to execute on your vision.`;
    reasoning.push(`Team covers ${teamSkills.length} of the key skills for this stage`);
  } else if (completionPercentage >= 50) {
    const topMissing = missingSkills.slice(0, 2).join(' and ');
    summary = `Your ${stageLabel} startup is ${completionPercentage}% team-complete. Consider strengthening ${topMissing || 'key areas'} to accelerate progress.`;
    reasoning.push(`${missingSkills.length} skill gap(s) identified for your current stage`);
  } else {
    summary = `Your ${stageLabel} startup is in early team-building at ${completionPercentage}% completeness. Focus on attracting talent with ${missingSkills[0] || 'core'} skills.`;
    reasoning.push(`Multiple skill gaps may slow progress at the ${stageLabel} stage`);
  }
  
  // Add context about interest
  if (interestCount > 0) {
    reasoning.push(`${interestCount} talent${interestCount > 1 ? 's have' : ' has'} expressed interest in your startup`);
  } else {
    reasoning.push('No talent interest yet — consider updating your startup description');
  }
  
  // Add stage context
  const stageInfo = STAGE_GUIDANCE[startup.stage];
  if (stageInfo) {
    reasoning.push(`At ${stageLabel}, the focus is typically on ${stageInfo.focus}`);
  }
  
  return {
    id: 'health-summary',
    title: 'Startup Health Summary',
    summary,
    reasoning,
    confidence: getConfidenceLevel(completionPercentage),
    category: 'health',
    icon: 'brain',
  };
}

/**
 * Generate next best actions for the founder
 */
function generateNextActions(
  startup: Startup,
  skillGap: SkillGapAnalysis,
  interestCount: number
): AIInsight[] {
  const actions: AIInsight[] = [];
  const { missingSkills, suggestedRoles, completionPercentage } = skillGap;
  
  // Action 1: Hiring recommendation (if gaps exist)
  if (missingSkills.length > 0 && suggestedRoles.length > 0) {
    actions.push({
      id: 'action-hire',
      title: 'Consider Growing Your Team',
      summary: `You may want to look for a ${suggestedRoles[0]} to fill a key skill gap in ${missingSkills[0]}.`,
      reasoning: [
        `${missingSkills[0]} is commonly needed at the ${STAGE_LABELS[startup.stage]} stage`,
        'Filling this gap could improve team effectiveness',
      ],
      confidence: getConfidenceLevel(70),
      category: 'action',
      icon: 'users',
    });
  }
  
  // Action 2: Engagement recommendation
  if (interestCount > 0) {
    const gapFillers = missingSkills.length > 0;
    actions.push({
      id: 'action-engage',
      title: 'Engage With Interested Talent',
      summary: gapFillers
        ? `Review the ${interestCount} interested talent${interestCount > 1 ? 's' : ''} — some may fill your skill gaps.`
        : `${interestCount} talent${interestCount > 1 ? 's are' : ' is'} interested — consider reaching out to discuss opportunities.`,
      reasoning: [
        'Timely responses improve your startup\'s reputation',
        gapFillers ? 'Prioritize candidates who match missing skills' : 'Early conversations help assess culture fit',
      ],
      confidence: getConfidenceLevel(80),
      category: 'action',
      icon: 'sparkles',
    });
  } else {
    actions.push({
      id: 'action-visibility',
      title: 'Improve Startup Visibility',
      summary: 'Consider enhancing your startup profile to attract more talent interest.',
      reasoning: [
        'A detailed description helps talent understand your vision',
        'Listing required skills helps attract relevant candidates',
      ],
      confidence: getConfidenceLevel(50),
      category: 'action',
      icon: 'lightbulb',
    });
  }
  
  // Action 3: Stage-specific action
  const stageInfo = STAGE_GUIDANCE[startup.stage];
  if (stageInfo && completionPercentage < 100) {
    const missingPriority = stageInfo.priorities.find(p => 
      missingSkills.some(s => s.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(s.toLowerCase()))
    );
    
    if (missingPriority) {
      actions.push({
        id: 'action-stage',
        title: 'Stage-Aligned Focus',
        summary: `For ${STAGE_LABELS[startup.stage]} startups, ${missingPriority.toLowerCase()} capabilities are often critical.`,
        reasoning: [
          `This aligns with the typical focus at your stage: ${stageInfo.focus}`,
          'Addressing this could accelerate your progress',
        ],
        confidence: getConfidenceLevel(60),
        category: 'action',
        icon: 'target',
      });
    }
  }
  
  return actions.slice(0, 3); // Max 3 actions
}

/**
 * Generate hiring priority insight
 */
function generateHiringPriority(
  startup: Startup,
  skillGap: SkillGapAnalysis
): AIInsight | null {
  const { missingSkills, suggestedRoles } = skillGap;
  
  if (missingSkills.length === 0) {
    return null;
  }
  
  const prioritySkills = getPrioritySkills(startup.stage);
  
  // Find the most critical missing skill
  const criticalMissing = missingSkills.find(skill => 
    prioritySkills.some(p => p.toLowerCase() === skill.toLowerCase())
  ) || missingSkills[0];
  
  const suggestedRole = suggestedRoles[0] || 'specialist';
  
  return {
    id: 'hiring-priority',
    title: 'Hiring Priority Suggestion',
    summary: `Based on your stage and skill gaps, a ${suggestedRole} could be your highest-priority addition.`,
    reasoning: [
      `${criticalMissing} is a key skill for ${STAGE_LABELS[startup.stage]} startups`,
      `This role addresses your most significant gap`,
      'Prioritizing this hire may have the highest impact on team effectiveness',
    ],
    confidence: getConfidenceLevel(65),
    category: 'priority',
    icon: 'trending',
  };
}

/**
 * Main function: Generate all founder insights
 */
export function generateFounderInsights(
  startup: Startup,
  interestedTalentSkills: string[] = [],
  interestCount: number = 0
): FounderInsights {
  // Calculate skill gap analysis
  const skillGap = calculateSkillGap(startup, interestedTalentSkills);
  
  return {
    healthSummary: generateHealthSummary(startup, skillGap, interestCount),
    nextActions: generateNextActions(startup, skillGap, interestCount),
    hiringPriority: generateHiringPriority(startup, skillGap),
  };
}

/**
 * Get a quick summary for dashboard cards
 */
export function getFounderQuickSummary(
  startup: Startup,
  interestCount: number = 0
): string {
  const skillGap = calculateSkillGap(startup);
  const { completionPercentage, missingSkills } = skillGap;
  
  if (completionPercentage >= 80) {
    return `Strong team coverage (${completionPercentage}%)`;
  }
  
  if (missingSkills.length > 0) {
    return `${completionPercentage}% complete — ${missingSkills[0]} needed`;
  }
  
  return `${completionPercentage}% team completeness`;
}
