import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Post, CreatePostInput, FeedFilters, analyzePost } from '@/lib/postAnalyzer';

export function usePosts(filters?: FeedFilters) {
    const { user, profile } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('posts')
                .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, trust_score, skills),
          startup:startups!posts_related_startup_id_fkey(id, name, stage, industry)
        `)
                .eq('visibility', 'public')
                .order('created_at', { ascending: false })
                .limit(50);

            // Apply filters
            if (filters?.post_type) {
                query = query.eq('post_type', filters.post_type);
            }

            if (filters?.startup_id) {
                query = query.eq('related_startup_id', filters.startup_id);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Calculate relevance scores client-side (simplified)
            const scoredPosts = (data || []).map((post: any) => {
                let relevanceScore = 50; // Base score

                // Recency boost (0-30 points)
                const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
                relevanceScore += Math.max(0, 30 - ageHours);

                // Impact boost
                if (post.impact_level === 'high') relevanceScore += 25;
                else if (post.impact_level === 'medium') relevanceScore += 15;

                // Author trust boost
                if (post.author?.trust_score) {
                    relevanceScore += post.author.trust_score * 0.2;
                }

                // Skill overlap boost
                if (profile?.skills && post.detected_skills) {
                    const overlap = profile.skills.filter((s: string) =>
                        post.detected_skills.includes(s)
                    ).length;
                    relevanceScore += overlap * 5;
                }

                return { ...post, relevance_score: relevanceScore };
            });

            // Sort by relevance
            scoredPosts.sort((a: any, b: any) => b.relevance_score - a.relevance_score);

            setPosts(scoredPosts);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, profile?.skills]);

    const createPost = async (input: CreatePostInput): Promise<boolean> => {
        if (!user || !profile) return false;

        try {
            // Analyze post with AI
            const analysis = analyzePost(input.content, profile.role);

            const postData = {
                author_id: user.id,
                related_startup_id: input.related_startup_id || null,
                post_type: input.post_type || analysis.detectedType,
                content: input.content,
                media_url: input.media_url || null,
                tags: input.tags || [],
                visibility: input.visibility || 'public',
                impact_level: analysis.impactLevel,
                trust_score_change: analysis.trustScoreChange,
                detected_skills: analysis.detectedSkills,
                recommended_audience: analysis.recommendedAudience,
            };

            const { error: insertError } = await supabase
                .from('posts')
                .insert(postData as any);

            if (insertError) throw insertError;

            // Refresh feed
            await fetchPosts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const savePost = async (postId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const { error: saveError } = await supabase
                .from('post_saves')
                .insert({ post_id: postId, user_id: user.id } as any);

            if (saveError) throw saveError;
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const unsavePost = async (postId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const { error: deleteError } = await supabase
                .from('post_saves')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Real-time subscription for new posts
    useEffect(() => {
        const channel = supabase
            .channel('posts-feed')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                },
                () => {
                    fetchPosts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);

    return {
        posts,
        loading,
        error,
        createPost,
        savePost,
        unsavePost,
        refetch: fetchPosts,
    };
}
