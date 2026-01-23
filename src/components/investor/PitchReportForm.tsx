import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { PitchRecommendation } from '@/types/database';

const pitchReportSchema = z.object({
  score: z.number().min(1).max(10),
  recommendation: z.enum(['invest', 'pass', 'watch']),
  summary: z.string().max(1000).optional(),
});

type PitchReportFormData = z.infer<typeof pitchReportSchema>;

interface PitchReportFormProps {
  startupId: string;
  startupName: string;
  existingReport?: {
    id: string;
    score: number;
    recommendation: PitchRecommendation;
    summary: string | null;
    strengths: string[] | null;
    weaknesses: string[] | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PitchReportForm({
  startupId,
  startupName,
  existingReport,
  onSuccess,
  onCancel,
}: PitchReportFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strengths, setStrengths] = useState<string[]>(existingReport?.strengths || []);
  const [weaknesses, setWeaknesses] = useState<string[]>(existingReport?.weaknesses || []);
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PitchReportFormData>({
    resolver: zodResolver(pitchReportSchema),
    defaultValues: {
      score: existingReport?.score || 5,
      recommendation: existingReport?.recommendation || 'watch',
      summary: existingReport?.summary || '',
    },
  });

  const currentScore = watch('score');
  const currentRecommendation = watch('recommendation');

  const addStrength = () => {
    const trimmed = strengthInput.trim();
    if (trimmed && !strengths.includes(trimmed) && strengths.length < 5) {
      setStrengths([...strengths, trimmed]);
      setStrengthInput('');
    }
  };

  const removeStrength = (item: string) => {
    setStrengths(strengths.filter((s) => s !== item));
  };

  const addWeakness = () => {
    const trimmed = weaknessInput.trim();
    if (trimmed && !weaknesses.includes(trimmed) && weaknesses.length < 5) {
      setWeaknesses([...weaknesses, trimmed]);
      setWeaknessInput('');
    }
  };

  const removeWeakness = (item: string) => {
    setWeaknesses(weaknesses.filter((w) => w !== item));
  };

  const onSubmit = async (data: PitchReportFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const reportData = {
        investor_id: user.id,
        startup_id: startupId,
        score: data.score,
        recommendation: data.recommendation,
        summary: data.summary || null,
        strengths: strengths.length > 0 ? strengths : null,
        weaknesses: weaknesses.length > 0 ? weaknesses : null,
      };

      if (existingReport) {
        const { error } = await supabase
          .from('pitch_reports')
          .update(reportData)
          .eq('id', existingReport.id);

        if (error) throw error;
        toast({ title: 'Pitch report updated!' });
      } else {
        const { error } = await supabase
          .from('pitch_reports')
          .insert(reportData);

        if (error) throw error;
        toast({ title: 'Pitch report created!' });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving pitch report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save pitch report. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'invest': return <TrendingUp className="h-4 w-4" />;
      case 'pass': return <TrendingDown className="h-4 w-4" />;
      case 'watch': return <Eye className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReport ? 'Edit' : 'Create'} Pitch Report</CardTitle>
        <CardDescription>
          Evaluate {startupName} and record your investment decision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Score */}
          <div className="space-y-3">
            <Label>Overall Score (1-10)</Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={currentScore}
                onChange={(e) => setValue('score', parseInt(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl">
                {currentScore}
              </div>
            </div>
            {errors.score && (
              <p className="text-sm text-destructive">{errors.score.message}</p>
            )}
          </div>

          {/* Recommendation */}
          <div className="space-y-3">
            <Label>Recommendation</Label>
            <RadioGroup
              value={currentRecommendation}
              onValueChange={(v) => setValue('recommendation', v as PitchRecommendation)}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="invest"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentRecommendation === 'invest'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:border-green-500/50'
                }`}
              >
                <RadioGroupItem value="invest" id="invest" className="sr-only" />
                <TrendingUp className={`h-6 w-6 mb-2 ${currentRecommendation === 'invest' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={currentRecommendation === 'invest' ? 'text-green-600 font-medium' : ''}>Invest</span>
              </Label>
              <Label
                htmlFor="watch"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentRecommendation === 'watch'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-border hover:border-yellow-500/50'
                }`}
              >
                <RadioGroupItem value="watch" id="watch" className="sr-only" />
                <Eye className={`h-6 w-6 mb-2 ${currentRecommendation === 'watch' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <span className={currentRecommendation === 'watch' ? 'text-yellow-600 font-medium' : ''}>Watch</span>
              </Label>
              <Label
                htmlFor="pass"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentRecommendation === 'pass'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                <RadioGroupItem value="pass" id="pass" className="sr-only" />
                <TrendingDown className={`h-6 w-6 mb-2 ${currentRecommendation === 'pass' ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={currentRecommendation === 'pass' ? 'text-red-600 font-medium' : ''}>Pass</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea
              id="summary"
              placeholder="Brief evaluation summary..."
              rows={3}
              {...register('summary')}
            />
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label>Strengths (up to 5)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a strength"
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStrength();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addStrength} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {strengths.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {strengths.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 bg-green-500/10 text-green-700">
                    {s}
                    <button type="button" onClick={() => removeStrength(s)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label>Weaknesses (up to 5)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a weakness"
                value={weaknessInput}
                onChange={(e) => setWeaknessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addWeakness();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addWeakness} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {weaknesses.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {weaknesses.map((w) => (
                  <Badge key={w} variant="secondary" className="gap-1 bg-red-500/10 text-red-700">
                    {w}
                    <button type="button" onClick={() => removeWeakness(w)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" variant="gradient" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingReport ? 'Update Report' : 'Create Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
