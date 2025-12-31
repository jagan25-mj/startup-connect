import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Post, POST_TYPE_CONFIG, formatPostTime } from '@/lib/postAnalyzer';
import { useAuth } from '@/hooks/useAuth';
import {
    Bookmark,
    BookmarkCheck,
    Building2,
    TrendingUp,
    Sparkles,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCardProps {
    post: Post;
    onSave?: (postId: string) => Promise<boolean>;
    onUnsave?: (postId: string) => Promise<boolean>;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function PostCard({ post, onSave, onUnsave }: PostCardProps) {
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const config = POST_TYPE_CONFIG[post.post_type];
    const author = post.author;

    const handleSaveToggle = async () => {
        if (!user || saveLoading) return;

        setSaveLoading(true);
        const success = isSaved
            ? await onUnsave?.(post.id)
            : await onSave?.(post.id);

        if (success) {
            setIsSaved(!isSaved);
        }
        setSaveLoading(false);
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Colored top bar based on post type */}
            <div className={cn('h-1', config.color.replace('/10', '').replace('text-', 'bg-').split(' ')[0])} />

            <CardContent className="p-4 space-y-3">
                {/* Header: Author + Time + Type */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link to={`/profile/${author?.id}`}>
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={author?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {author?.full_name ? getInitials(author.full_name) : '?'}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/profile/${author?.id}`}
                                    className="font-semibold text-sm hover:text-primary transition-colors"
                                >
                                    {author?.full_name || 'Unknown'}
                                </Link>
                                <Badge variant="outline" className="text-xs capitalize">
                                    {author?.role}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatPostTime(post.created_at)}</span>
                                {post.startup && (
                                    <>
                                        <span>•</span>
                                        <Link
                                            to={`/startups/${post.startup.id}`}
                                            className="flex items-center gap-1 hover:text-primary transition-colors"
                                        >
                                            <Building2 className="h-3 w-3" />
                                            {post.startup.name}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Badge variant="outline" className={cn('text-xs', config.color)}>
                        {config.emoji} {config.label}
                    </Badge>
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Skills detected */}
                {post.detected_skills && post.detected_skills.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span>Skills:</span>
                        {post.detected_skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Footer: Impact + Save */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3">
                        {/* Impact Level */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    'flex items-center gap-1 text-xs',
                                    post.impact_level === 'high' ? 'text-green-500' :
                                        post.impact_level === 'medium' ? 'text-blue-500' :
                                            'text-muted-foreground'
                                )}>
                                    <TrendingUp className="h-3 w-3" />
                                    <span className="capitalize">{post.impact_level} Impact</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This post shows {post.impact_level} execution signal</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Trust bonus */}
                        {post.trust_score_change > 0 && (
                            <span className="text-xs text-green-500">
                                +{post.trust_score_change} trust
                            </span>
                        )}
                    </div>

                    {/* Save button */}
                    {user && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveToggle}
                            disabled={saveLoading}
                            className="h-8 px-2"
                        >
                            {isSaved ? (
                                <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                            <span className="ml-1 text-xs">
                                {post.save_count > 0 ? post.save_count : 'Save'}
                            </span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
