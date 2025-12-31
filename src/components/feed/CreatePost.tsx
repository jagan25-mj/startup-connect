import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { PostType, POST_TYPE_CONFIG, analyzePost } from '@/lib/postAnalyzer';
import { Loader2, Send, Sparkles, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatePostProps {
    startupId?: string;
    onSuccess?: () => void;
}

export function CreatePost({ startupId, onSuccess }: CreatePostProps) {
    const { profile } = useAuth();
    const { createPost } = usePosts();
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Analyze content as user types
    const analysis = content.length >= 20 && profile
        ? analyzePost(content, profile.role)
        : null;

    const handleSubmit = async () => {
        if (!content.trim() || content.length < 10) return;

        setIsLoading(true);
        const success = await createPost({
            content: content.trim(),
            post_type: postType,
            related_startup_id: startupId,
        });

        setIsLoading(false);

        if (success) {
            setContent('');
            setPostType(undefined);
            setShowAnalysis(false);
            onSuccess?.();
        }
    };

    return (
        <Card className="animate-fade-in">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Share an Update
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Post Type Selector */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(POST_TYPE_CONFIG).map(([type, config]) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setPostType(postType === type ? undefined : type as PostType)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                                postType === type
                                    ? config.color + ' border-current'
                                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                            )}
                        >
                            {config.emoji} {config.label}
                        </button>
                    ))}
                </div>

                {/* Content Input */}
                <div className="space-y-2">
                    <Textarea
                        placeholder={
                            postType === 'progress' ? "Share what you've built or shipped..." :
                                postType === 'achievement' ? "Celebrate your win..." :
                                    postType === 'hiring' ? "Describe who you're looking for..." :
                                        postType === 'milestone' ? "Announce your milestone..." :
                                            postType === 'learning' ? "Share what you've learned..." :
                                                "What's happening with your startup?"
                        }
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (e.target.value.length >= 20) setShowAnalysis(true);
                        }}
                        rows={4}
                        className="resize-none"
                        maxLength={2000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{content.length}/2000</span>
                        {content.length < 10 && content.length > 0 && (
                            <span className="text-amber-500">Minimum 10 characters</span>
                        )}
                    </div>
                </div>

                {/* AI Analysis Preview */}
                {showAnalysis && analysis && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" />
                            AI Analysis Preview
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Type:</span>
                                <Badge variant="outline" className={POST_TYPE_CONFIG[analysis.detectedType].color}>
                                    {POST_TYPE_CONFIG[analysis.detectedType].emoji} {POST_TYPE_CONFIG[analysis.detectedType].label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Impact:</span>
                                <Badge variant="outline" className={
                                    analysis.impactLevel === 'high' ? 'bg-green-500/10 text-green-600' :
                                        analysis.impactLevel === 'medium' ? 'bg-blue-500/10 text-blue-600' :
                                            'bg-gray-500/10 text-gray-600'
                                }>
                                    {analysis.impactLevel.charAt(0).toUpperCase() + analysis.impactLevel.slice(1)}
                                </Badge>
                            </div>
                        </div>
                        {analysis.detectedSkills.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">Skills detected:</span>
                                {analysis.detectedSkills.slice(0, 3).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">+{analysis.trustScoreChange} trust points</span>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || content.length < 10}
                        variant="gradient"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Post Update
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
