import { Startup, SKILLS } from '@/types/database';

// Skill categories for role suggestions
const SKILL_ROLE_MAP: Record<string, string[]> = {
    'UI/UX Design': ['UI/UX Designer', 'Product Designer'],
    'Product Management': ['Product Manager', 'Head of Product'],
    'Marketing': ['Marketing Lead', 'Growth Marketer'],
    'Sales': ['Sales Lead', 'Business Development'],
    'Finance': ['CFO', 'Finance Lead'],
    'Legal': ['Legal Counsel', 'Compliance Officer'],
    'DevOps': ['DevOps Engineer', 'SRE'],
    'Machine Learning': ['ML Engineer', 'AI Specialist'],
    'Data Science': ['Data Scientist', 'Analytics Lead'],
    'Mobile Development': ['Mobile Developer', 'iOS/Android Engineer'],
    'Cloud Computing': ['Cloud Architect', 'Infrastructure Engineer'],
    'Blockchain': ['Blockchain Developer', 'Web3 Engineer'],
    'Healthcare': ['Healthcare Specialist', 'Clinical Advisor'],
    'Operations': ['Operations Manager', 'COO'],
    'Business Development': ['BD Lead', 'Partnership Manager'],
};

// Skills typically needed at different startup stages
const STAGE_SKILL_REQUIREMENTS: Record<string, string[]> = {
    idea: ['Product Management', 'UI/UX Design'],
    mvp: ['React', 'TypeScript', 'UI/UX Design', 'Product Management'],
    early_stage: ['Marketing', 'Sales', 'DevOps', 'Product Management'],
    growth: ['Marketing', 'Sales', 'Data Science', 'Operations', 'Finance'],
    scaling: ['Operations', 'Finance', 'Legal', 'DevOps', 'Business Development'],
};

export interface SkillGapAnalysis {
    requiredSkills: string[];
    teamSkills: string[];
    missingSkills: string[];
    completionPercentage: number;
    suggestedRoles: string[];
    stageBasedRecommendations: string[];
}

/**
 * Calculate skill gap analysis for a startup
 * Uses stage-based skill requirements since startups don't have explicit required_skills
 */
export function calculateSkillGap(
    startup: Startup,
    interestedTalentSkills: string[] = []
): SkillGapAnalysis {
    // Infer required skills from startup stage
    const requiredSkills = STAGE_SKILL_REQUIREMENTS[startup.stage] || [];

    // Get team skills from founder + interested talent
    const founderSkills = startup.founder?.skills || [];
    const teamSkills = [
        ...founderSkills,
        ...interestedTalentSkills,
    ];

    // Deduplicate
    const uniqueTeamSkills = [...new Set(teamSkills)];
    const uniqueRequiredSkills = [...new Set(requiredSkills)];

    // Find missing skills
    const missingSkills = uniqueRequiredSkills.filter(
        (skill: string) => !uniqueTeamSkills.some(
            (teamSkill: string) => teamSkill.toLowerCase() === skill.toLowerCase()
        )
    );

    // Calculate completion percentage
    const totalRequired = uniqueRequiredSkills.length;
    const covered = totalRequired - missingSkills.length;
    const completionPercentage = totalRequired > 0
        ? Math.round((covered / totalRequired) * 100)
        : 100;

    // Suggest roles based on missing skills
    const suggestedRoles: string[] = [];
    missingSkills.forEach((skill: string) => {
        const roles = SKILL_ROLE_MAP[skill];
        if (roles) {
            suggestedRoles.push(roles[0]); // Add primary role suggestion
        }
    });

    // Stage-based recommendations
    const stageRecommendations = STAGE_SKILL_REQUIREMENTS[startup.stage] || [];
    const stageBasedRecommendations = stageRecommendations.filter(
        (skill: string) => !uniqueTeamSkills.some(
            (teamSkill: string) => teamSkill.toLowerCase() === skill.toLowerCase()
        )
    );

    return {
        requiredSkills: uniqueRequiredSkills,
        teamSkills: uniqueTeamSkills,
        missingSkills,
        completionPercentage,
        suggestedRoles: [...new Set(suggestedRoles)],
        stageBasedRecommendations,
    };
}

/**
 * Check if a talent fills a skill gap for a startup
 */
export function talentFillsSkillGap(
    talentSkills: string[],
    startup: Startup
): { fills: boolean; matchedSkills: string[] } {
    const { missingSkills } = calculateSkillGap(startup);

    const matchedSkills = talentSkills.filter(skill =>
        missingSkills.some(
            missing => missing.toLowerCase() === skill.toLowerCase()
        )
    );

    return {
        fills: matchedSkills.length > 0,
        matchedSkills,
    };
}

/**
 * Get completion message based on percentage
 */
export function getCompletionMessage(
    completionPercentage: number,
    suggestedRoles: string[]
): string {
    if (completionPercentage >= 100) {
        return "Your team has strong skill coverage. You're well-positioned!";
    }

    if (completionPercentage >= 80) {
        return "Your team looks well-rounded. You might consider specialized skills as you grow.";
    }

    if (completionPercentage >= 60) {
        const nextRole = suggestedRoles[0] || "a specialist";
        return `Good progress! Our insights suggest ${nextRole} could help accelerate your goals.`;
    }

    if (completionPercentage >= 40) {
        return "Your core team is forming. Consider which gaps matter most to you.";
    }

    return "Early stage! Focus on what feels most critical for your vision.";
}

/**
 * Get priority skills based on startup stage
 */
export function getPrioritySkills(stage: string): string[] {
    return STAGE_SKILL_REQUIREMENTS[stage] || [];
}
