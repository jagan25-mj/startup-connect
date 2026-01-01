import { Profile, Startup } from '@/types/database';
import { calculateSkillGap, SkillGapAnalysis } from './skillGap';

// =============================================================================
// AI CO-FOUNDER MATCHING ENGINE
// Analyzes compatibility between candidates and startups like a VC + tech co-founder
// =============================================================================

export interface FounderProfile {
    name: string;
    role: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
    skills: string[];
    strengths: string[];
    weaknesses: string[];
    availability: 'full_time' | 'part_time' | 'consulting';
}

export interface StartupDetails {
    name: string;
    problem: string;
    targetUsers: string;
    stage: 'idea' | 'mvp' | 'early_stage' | 'growth' | 'scaling';
    requiredSkills: string[];
    industry: string;
}

export interface TeamMember {
    name: string;
    role: string;
    skills: string[];
}

export interface CandidateProfile {
    name: string;
    primarySkills: string[];
    secondarySkills: string[];
    experience: string;
    interests: string[];
    availability: 'full_time' | 'part_time' | 'consulting';
}

export interface MatchAnalysis {
    compatibilityScore: number;
    fitSummary: string;
    strengths: string[];
    risks: string[];
    recommendedRole: {
        title: string;
        responsibility: string;
    };
    teamImpactPrediction: string;
    optionalInsight: string;
    skillGapsCovered: string[];
    skillGapsRemaining: string[];
}

// Experience level multipliers
const EXPERIENCE_WEIGHTS: Record<string, number> = {
    junior: 0.6,
    mid: 0.8,
    senior: 1.0,
    expert: 1.1,
};

// Stage requirements - different stages need different skills
const STAGE_PRIORITIES: Record<string, string[]> = {
    idea: ['Product Management', 'UI/UX Design', 'Marketing'],
    mvp: ['React', 'TypeScript', 'Node.js', 'UI/UX Design'],
    early_stage: ['Marketing', 'Sales', 'DevOps', 'Product Management'],
    growth: ['Marketing', 'Sales', 'Data Science', 'Operations'],
    scaling: ['Operations', 'Finance', 'Legal', 'Business Development'],
};

// Role suggestions based on skills
const SKILL_TO_ROLE: Record<string, { title: string; responsibility: string }> = {
    'React': { title: 'Frontend Engineer', responsibility: 'Build user-facing features and improve UX' },
    'TypeScript': { title: 'Full-Stack Developer', responsibility: 'End-to-end feature development' },
    'Node.js': { title: 'Backend Engineer', responsibility: 'API design and server infrastructure' },
    'Python': { title: 'Backend/ML Engineer', responsibility: 'Data processing and automation' },
    'Machine Learning': { title: 'ML Engineer', responsibility: 'Build intelligent features and models' },
    'UI/UX Design': { title: 'Product Designer', responsibility: 'Design intuitive user experiences' },
    'Product Management': { title: 'Product Manager', responsibility: 'Define roadmap and prioritize features' },
    'Marketing': { title: 'Growth Lead', responsibility: 'User acquisition and brand building' },
    'Sales': { title: 'Sales Lead', responsibility: 'Revenue generation and partnerships' },
    'Finance': { title: 'Finance Lead', responsibility: 'Financial planning and fundraising support' },
    'DevOps': { title: 'DevOps Engineer', responsibility: 'Infrastructure and deployment automation' },
    'Data Science': { title: 'Data Scientist', responsibility: 'Analytics and data-driven decisions' },
    'Mobile Development': { title: 'Mobile Engineer', responsibility: 'Native mobile app development' },
    'Business Development': { title: 'BD Lead', responsibility: 'Strategic partnerships and expansion' },
};

/**
 * AI Co-Founder Matching Engine
 * Analyzes compatibility between a candidate and a startup opportunity
 */
export function analyzeMatch(
    founder: FounderProfile,
    startup: StartupDetails,
    existingTeam: TeamMember[],
    candidate: CandidateProfile
): MatchAnalysis {
    // 1. Calculate skill gap coverage
    const allTeamSkills = [
        ...founder.skills,
        ...existingTeam.flatMap(m => m.skills),
    ];

    const missingSkills = startup.requiredSkills.filter(
        skill => !allTeamSkills.some(
            ts => ts.toLowerCase() === skill.toLowerCase()
        )
    );

    const candidateAllSkills = [...candidate.primarySkills, ...candidate.secondarySkills];

    const skillGapsCovered = missingSkills.filter(
        skill => candidateAllSkills.some(
            cs => cs.toLowerCase() === skill.toLowerCase()
        )
    );

    const skillGapsRemaining = missingSkills.filter(
        skill => !candidateAllSkills.some(
            cs => cs.toLowerCase() === skill.toLowerCase()
        )
    );

    // 2. Calculate base compatibility score
    let score = 0;

    // Skill gap coverage (40 points max)
    const gapCoverageRatio = missingSkills.length > 0
        ? skillGapsCovered.length / missingSkills.length
        : 0.5;
    score += gapCoverageRatio * 40;

    // Primary skill match with required skills (25 points max)
    const primaryMatches = candidate.primarySkills.filter(
        skill => startup.requiredSkills.some(
            rs => rs.toLowerCase() === skill.toLowerCase()
        )
    ).length;
    score += Math.min(primaryMatches / 2, 1) * 25;

    // Stage-appropriate skills (15 points max)
    const stagePriorities = STAGE_PRIORITIES[startup.stage] || [];
    const stageMatches = candidateAllSkills.filter(
        skill => stagePriorities.some(
            sp => sp.toLowerCase() === skill.toLowerCase()
        )
    ).length;
    score += Math.min(stageMatches / 2, 1) * 15;

    // Availability match (10 points max)
    const availabilityMatch = candidate.availability === 'full_time' ? 1 :
        candidate.availability === 'part_time' ? 0.6 : 0.4;
    score += availabilityMatch * 10;

    // Interest alignment (10 points max)
    const industryInterest = candidate.interests.some(
        i => i.toLowerCase().includes(startup.industry.toLowerCase()) ||
            startup.industry.toLowerCase().includes(i.toLowerCase())
    );
    score += industryInterest ? 10 : 3;

    // Round score
    score = Math.round(Math.min(100, Math.max(0, score)));

    // 3. Determine recommended role
    let recommendedRole = { title: 'Team Member', responsibility: 'Contribute to team goals' };
    for (const skill of candidate.primarySkills) {
        if (SKILL_TO_ROLE[skill]) {
            recommendedRole = SKILL_TO_ROLE[skill];
            break;
        }
    }

    // 4. Generate strengths
    const strengths: string[] = [];

    if (skillGapsCovered.length > 0) {
        strengths.push(`Fills critical skill gap${skillGapsCovered.length > 1 ? 's' : ''}: ${skillGapsCovered.join(', ')}`);
    }

    if (candidate.availability === 'full_time') {
        strengths.push('Full-time availability ensures dedicated commitment');
    }

    if (candidate.primarySkills.length >= 2) {
        strengths.push(`Strong primary expertise in ${candidate.primarySkills.slice(0, 2).join(' and ')}`);
    }

    if (industryInterest) {
        strengths.push(`Genuine interest in ${startup.industry} domain`);
    }

    if (stageMatches >= 2) {
        strengths.push(`Skills well-suited for ${startup.stage.replace('_', ' ')} stage startups`);
    }

    // 5. Identify risks
    const risks: string[] = [];

    if (skillGapsRemaining.length > 0) {
        risks.push(`Critical skills still missing: ${skillGapsRemaining.slice(0, 3).join(', ')}`);
    }

    if (candidate.availability !== 'full_time') {
        risks.push(`Part-time availability may slow execution speed`);
    }

    // Check for skill overlap (redundancy)
    const overlappingSkills = candidateAllSkills.filter(
        skill => allTeamSkills.some(
            ts => ts.toLowerCase() === skill.toLowerCase()
        )
    );
    if (overlappingSkills.length > candidateAllSkills.length * 0.7) {
        risks.push('High skill overlap with existing team - limited additive value');
    }

    if (!industryInterest) {
        risks.push('No demonstrated interest in startup domain');
    }

    // 6. Generate fit summary
    let fitSummary = '';
    if (score >= 80) {
        fitSummary = `Excellent match. ${candidate.name} brings ${skillGapsCovered.length} critical skills the team is missing and shows strong alignment with the ${startup.stage.replace('_', ' ')} stage requirements. This candidate would significantly accelerate ${startup.name}'s progress.`;
    } else if (score >= 60) {
        fitSummary = `Good match with some considerations. ${candidate.name} covers ${skillGapsCovered.length} needed skill${skillGapsCovered.length !== 1 ? 's' : ''} and could contribute meaningfully to ${startup.name}. However, ${risks[0]?.toLowerCase() || 'some gaps remain'}.`;
    } else if (score >= 40) {
        fitSummary = `Moderate match. While ${candidate.name} has relevant skills, the fit with ${startup.name}'s current needs is limited. The team should ${skillGapsRemaining.length > 0 ? 'prioritize candidates with ' + skillGapsRemaining[0] : 'evaluate other candidates'}.`;
    } else {
        fitSummary = `Weak match. ${candidate.name}'s skill set does not align well with ${startup.name}'s current requirements. Consider other candidates who can fill the critical gaps in ${skillGapsRemaining.slice(0, 2).join(' and ')}.`;
    }

    // 7. Team impact prediction
    let teamImpactPrediction = '';
    if (score >= 70) {
        teamImpactPrediction = `Adding ${candidate.name} would transform ${startup.name}'s execution capability. With ${recommendedRole.title} role filled, the team can ${startup.stage === 'idea' ? 'move faster toward MVP' : startup.stage === 'mvp' ? 'focus on product-market fit' : 'scale more effectively'}. Expected velocity increase: ${Math.round(score / 10)}0%.`;
    } else if (score >= 50) {
        teamImpactPrediction = `${candidate.name} would add value but won't be a game-changer. The team would still need to hire for ${skillGapsRemaining.slice(0, 2).join(' and ')} to reach full potential.`;
    } else {
        teamImpactPrediction = `Limited team improvement expected. The core gaps would remain unfilled, and the team should prioritize finding candidates with stronger alignment to critical needs.`;
    }

    // 8. Optional insight
    let optionalInsight = '';
    if (skillGapsRemaining.length > 0 && score >= 50) {
        optionalInsight = `Consider pairing this hire with a ${skillGapsRemaining[0]} specialist within 3 months to complete the core team composition.`;
    } else if (score >= 80) {
        optionalInsight = `Move quickly - strong candidates get multiple offers. Consider offering equity acceleration or a co-founder title to secure commitment.`;
    } else if (score < 40) {
        optionalInsight = `Before hiring, clearly define the top 2-3 skill gaps and create specific job descriptions targeting those competencies.`;
    } else {
        optionalInsight = `Consider a trial project or consulting engagement before full commitment to validate working style compatibility.`;
    }

    return {
        compatibilityScore: score,
        fitSummary,
        strengths: strengths.slice(0, 4),
        risks: risks.slice(0, 3),
        recommendedRole,
        teamImpactPrediction,
        optionalInsight,
        skillGapsCovered,
        skillGapsRemaining,
    };
}

/**
 * Simplified match analysis using database Profile and Startup types
 */
export function analyzeProfileStartupMatch(
    startup: Startup,
    candidate: Profile,
    existingTeamSkills: string[] = []
): MatchAnalysis {
    const founder: FounderProfile = {
        name: startup.founder?.full_name || 'Founder',
        role: 'Founder',
        experienceLevel: 'mid',
        skills: startup.founder?.skills || [],
        strengths: [],
        weaknesses: [],
        availability: 'full_time',
    };

    const startupDetails: StartupDetails = {
        name: startup.name,
        problem: startup.description,
        targetUsers: '',
        stage: startup.stage,
        requiredSkills: [], // Inferred from stage in matching logic
        industry: startup.industry,
    };

    const candidateProfile: CandidateProfile = {
        name: candidate.full_name,
        primarySkills: candidate.skills?.slice(0, 3) || [],
        secondarySkills: candidate.skills?.slice(3) || [],
        experience: candidate.bio || '',
        interests: [startup.industry],
        availability: 'part_time', // Default availability
    };

    const existingTeam: TeamMember[] = existingTeamSkills.length > 0 ? [{
        name: 'Team',
        role: 'Various',
        skills: existingTeamSkills,
    }] : [];

    return analyzeMatch(founder, startupDetails, existingTeam, candidateProfile);
}

/**
 * Get match quality label from score
 */
export function getMatchQuality(score: number): {
    label: string;
    color: string;
    emoji: string;
} {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-green-500', emoji: '🌟' };
    if (score >= 60) return { label: 'Good Match', color: 'text-blue-500', emoji: '✅' };
    if (score >= 40) return { label: 'Moderate Match', color: 'text-amber-500', emoji: '⚠️' };
    return { label: 'Weak Match', color: 'text-red-500', emoji: '❌' };
}
