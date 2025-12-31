import { Profile, Startup, UserRole } from '@/types/database';

// =============================================================================
// POST TYPES & INTERFACES
// =============================================================================

export type PostType = 'progress' | 'achievement' | 'hiring' | 'milestone' | 'learning';
export type PostVisibility = 'public' | 'network';
export type ImpactLevel = 'low' | 'medium' | 'high';

export interface Post {
    id: string;
    author_id: string;
    related_startup_id: string | null;
    post_type: PostType;
    content: string;
    media_url: string | null;
    tags: string[];
    visibility: PostVisibility;
    impact_level: ImpactLevel;
    trust_score_change: number;
    detected_skills: string[];
    recommended_audience: string[];
    save_count: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    author?: Profile;
    startup?: Startup;
    relevance_score?: number;
}

export interface PostSave {
    id: string;
    post_id: string;
    user_id: string;
    created_at: string;
}

export interface CreatePostInput {
    post_type?: PostType;
    content: string;
    media_url?: string;
    tags?: string[];
    visibility?: PostVisibility;
    related_startup_id?: string;
}

export interface FeedFilters {
    post_type?: PostType;
    author_role?: UserRole;
    startup_id?: string;
    tags?: string[];
}

// =============================================================================
// POST TYPE METADATA
// =============================================================================

export const POST_TYPE_CONFIG: Record<PostType, {
    label: string;
    emoji: string;
    color: string;
    description: string;
    trustBonus: { min: number; max: number };
}> = {
    progress: {
        label: 'Progress Update',
        emoji: '🚀',
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        description: 'Product updates, feature shipping, sprint completion',
        trustBonus: { min: 1, max: 3 },
    },
    achievement: {
        label: 'Achievement',
        emoji: '🏆',
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        description: 'Certifications, hackathons, milestones',
        trustBonus: { min: 2, max: 5 },
    },
    hiring: {
        label: 'Hiring',
        emoji: '👥',
        color: 'bg-green-500/10 text-green-600 border-green-500/30',
        description: 'Looking for teammates or collaborators',
        trustBonus: { min: 0, max: 2 },
    },
    milestone: {
        label: 'Milestone',
        emoji: '🎯',
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        description: 'Funding, MVP launch, beta release',
        trustBonus: { min: 3, max: 7 },
    },
    learning: {
        label: 'Learning',
        emoji: '📚',
        color: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
        description: 'Technical or startup learning',
        trustBonus: { min: 1, max: 2 },
    },
};

// =============================================================================
// AI POST CLASSIFIER & ANALYZER
// =============================================================================

// Keywords for automatic post type detection
const POST_TYPE_KEYWORDS: Record<PostType, string[]> = {
    progress: ['shipped', 'released', 'built', 'completed', 'launched feature', 'sprint', 'deployed', 'implemented', 'fixed', 'updated'],
    achievement: ['won', 'awarded', 'certified', 'hackathon', 'first place', 'recognized', 'published', 'graduated', 'accomplished'],
    hiring: ['hiring', 'looking for', 'seeking', 'join us', 'co-founder', 'team member', 'collaborator', 'position open', 'opportunity'],
    milestone: ['raised', 'funding', 'seed round', 'mvp', 'launched', 'beta', 'acquired', 'partnership', '10k users', 'revenue'],
    learning: ['learned', 'studying', 'course', 'tutorial', 'discovered', 'explored', 'reading', 'workshop', 'conference'],
};

// Skill detection patterns
const SKILL_PATTERNS: string[] = [
    'react', 'typescript', 'javascript', 'python', 'node', 'aws', 'docker',
    'machine learning', 'ai', 'design', 'ui/ux', 'product', 'marketing',
    'sales', 'finance', 'devops', 'mobile', 'ios', 'android', 'blockchain',
    'data science', 'analytics', 'growth', 'leadership', 'strategy'
];

export interface PostAnalysis {
    detectedType: PostType;
    impactLevel: ImpactLevel;
    trustScoreChange: number;
    detectedSkills: string[];
    recommendedAudience: string[];
    confidence: number;
}

/**
 * AI Post Analyzer - Classifies and scores posts
 */
export function analyzePost(content: string, authorRole: UserRole): PostAnalysis {
    const lowerContent = content.toLowerCase();

    // 1. Detect post type
    let detectedType: PostType = 'progress';
    let maxMatches = 0;

    for (const [type, keywords] of Object.entries(POST_TYPE_KEYWORDS)) {
        const matches = keywords.filter(kw => lowerContent.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedType = type as PostType;
        }
    }

    // 2. Detect skills mentioned
    const detectedSkills = SKILL_PATTERNS.filter(skill =>
        lowerContent.includes(skill.toLowerCase())
    );

    // 3. Calculate impact level
    let impactLevel: ImpactLevel = 'low';
    const config = POST_TYPE_CONFIG[detectedType];

    // High impact indicators
    const highImpactKeywords = ['launched', 'raised', 'funding', 'million', 'acquired', 'first', 'record'];
    const mediumImpactKeywords = ['completed', 'shipped', 'released', 'hired', 'partnership'];

    if (highImpactKeywords.some(kw => lowerContent.includes(kw))) {
        impactLevel = 'high';
    } else if (mediumImpactKeywords.some(kw => lowerContent.includes(kw))) {
        impactLevel = 'medium';
    }

    // 4. Calculate trust score change
    let trustScoreChange = 0;
    switch (impactLevel) {
        case 'high':
            trustScoreChange = config.trustBonus.max;
            break;
        case 'medium':
            trustScoreChange = Math.floor((config.trustBonus.min + config.trustBonus.max) / 2);
            break;
        default:
            trustScoreChange = config.trustBonus.min;
    }

    // 5. Determine recommended audience
    const recommendedAudience: string[] = [];

    if (detectedType === 'hiring') {
        recommendedAudience.push('Talent looking for opportunities');
        if (detectedSkills.length > 0) {
            recommendedAudience.push(`${detectedSkills[0]} specialists`);
        }
    } else if (detectedType === 'milestone' || detectedType === 'progress') {
        recommendedAudience.push('Founders at similar stage');
        recommendedAudience.push('Potential collaborators');
    } else if (detectedType === 'learning') {
        recommendedAudience.push('Fellow learners');
        if (detectedSkills.length > 0) {
            recommendedAudience.push(`${detectedSkills[0]} community`);
        }
    }

    // Add role-specific audience
    if (authorRole === 'founder') {
        recommendedAudience.push('Talent interested in startups');
    } else {
        recommendedAudience.push('Founders looking for talent');
    }

    // 6. Calculate confidence
    const confidence = Math.min(100, maxMatches * 20 + detectedSkills.length * 10 + 30);

    return {
        detectedType,
        impactLevel,
        trustScoreChange,
        detectedSkills,
        recommendedAudience: recommendedAudience.slice(0, 3),
        confidence,
    };
}

/**
 * Format relative time for posts
 */
export function formatPostTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
