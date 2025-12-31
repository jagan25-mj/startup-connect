import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRIES, STAGE_LABELS, StartupStage, SKILLS } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Rocket, X, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const startupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  industry: z.string().min(1, 'Please select an industry'),
  stage: z.enum(['idea', 'mvp', 'early_stage', 'growth', 'scaling']),
});

type StartupForm = z.infer<typeof startupSchema>;

export default function CreateStartup() {
  const [isLoading, setIsLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StartupForm>({
    resolver: zodResolver(startupSchema),
    defaultValues: {
      stage: 'idea',
    },
  });

  const onSubmit = async (data: StartupForm) => {
    if (!user) return;

    setIsLoading(true);

    const { data: startup, error } = await supabase
      .from('startups')
      .insert({
        name: data.name,
        description: data.description,
        industry: data.industry,
        stage: data.stage,
        founder_id: user.id,
        required_skills: requiredSkills,
      } as any)
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create startup. Please try again.',
      });
      return;
    }

    toast({
      title: 'Startup created!',
      description: 'Your startup has been successfully created.',
    });
    navigate(`/startups/${startup.id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/startups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Startups
        </Link>

        <Card className="animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
              <Rocket className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Create Your Startup</CardTitle>
            <CardDescription>
              Share your vision and attract talented collaborators
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., TechVenture AI"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select onValueChange={(value) => setValue('industry', value)}>
                    <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-destructive">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    defaultValue="idea"
                    onValueChange={(value) => setValue('stage', value as StartupStage)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Required Skills Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Skills You're Looking For
                </Label>
                <Select onValueChange={(skill) => {
                  if (!requiredSkills.includes(skill) && requiredSkills.length < 10) {
                    setRequiredSkills([...requiredSkills, skill]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add skills you need" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.filter(s => !requiredSkills.includes(s)).map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requiredSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => setRequiredSkills(requiredSkills.filter(s => s !== skill))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select skills to help match with talent
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your startup idea, the problem you're solving, and what kind of team members you're looking for..."
                  rows={6}
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum 50 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Startup
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
