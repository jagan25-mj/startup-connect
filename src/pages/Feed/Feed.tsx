import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PostType, POST_TYPE_CONFIG } from '@/lib/postAnalyzer';
import {
    Rss,
    Filter,
    Sparkles,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Feed() {
    const { user, profile } = useAuth();
    const [selectedType, setSelectedType] = useState<PostType | undefined>();
    const { posts, loading, savePost, unsavePost, refetch } = usePosts(
        selectedType ? { post_type: selectedType } : undefined
    );

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Rss className="h-8 w-8 text-primary" />
                                Activity Feed
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Discover progress, achievements, and opportunities
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={refetch}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {/* AI Feed Info */}
                    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">AI-Powered Feed</p>
                                    <p className="text-xs text-muted-foreground">
                                        Posts are ranked by relevance to your skills, role, and interests.
                                        High-impact updates appear first.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Create Post (if logged in) */}
                    {user && profile && (
                        <CreatePost onSuccess={refetch} />
                    )}

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Button
                            variant={selectedType === undefined ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedType(undefined)}
                        >
                            All
                        </Button>
                        {Object.entries(POST_TYPE_CONFIG).map(([type, config]) => (
                            <Button
                                key={type}
                                variant={selectedType === type ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedType(type as PostType)}
                                className="whitespace-nowrap"
                            >
                                {config.emoji} {config.label}
                            </Button>
                        ))}
                    </div>

                    {/* Posts List */}
                    <div className="space-y-4">
                        {loading ? (
                            // Loading skeletons
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-20 w-full" />
                                </Card>
                            ))
                        ) : posts.length === 0 ? (
                            // Empty state
                            <Card className="p-8 text-center">
                                <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    {user
                                        ? "Be the first to share an update!"
                                        : "Sign in to see personalized content and post updates."}
                                </p>
                                {!user && (
                                    <Button asChild variant="gradient">
                                        <a href="/auth/register">Get Started</a>
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            // Posts
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onSave={savePost}
                                    onUnsave={unsavePost}
                                />
                            ))
                        )}
                    </div>

                    {/* Load more */}
                    {posts.length >= 20 && (
                        <div className="text-center">
                            <Button variant="outline">
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
