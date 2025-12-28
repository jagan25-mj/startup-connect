import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { INDUSTRIES, STAGE_LABELS, StartupStage, Startup } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Pencil } from 'lucide-react';

const startupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  industry: z.string().min(1, 'Please select an industry'),
  stage: z.enum(['idea', 'mvp', 'early_stage', 'growth', 'scaling']),
});

type StartupForm = z.infer<typeof startupSchema>;

export default function EditStartup() {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StartupForm>({
    resolver: zodResolver(startupSchema),
  });

  const fetchStartup = useCallback(async () => {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setStartup(data as Startup);
      reset({
        name: data.name,
        description: data.description,
        industry: data.industry,
        stage: data.stage as StartupStage,
      });
    }
    setFetchLoading(false);
  }, [id, reset]);

  useEffect(() => {
    if (id) {
      fetchStartup();
    }
  }, [id, fetchStartup]);

  const onSubmit = async (data: StartupForm) => {
    if (!user || !id) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from('startups')
      .update({
        name: data.name,
        description: data.description,
        industry: data.industry,
        stage: data.stage,
      })
      .eq('id', id);

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update startup. Please try again.',
      });
      return;
    }

    toast({
      title: 'Startup updated!',
      description: 'Your changes have been saved.',
    });
    navigate(`/startups/${id}`);
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!startup || startup.founder_id !== user?.id) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Startup not found or access denied</h1>
          <Button asChild>
            <Link to="/startups">Back to Startups</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link 
          to={`/startups/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Startup
        </Link>

        <Card className="animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Pencil className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Edit Startup</CardTitle>
            <CardDescription>
              Update your startup details
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
                  <Select 
                    defaultValue={startup.industry}
                    onValueChange={(value) => setValue('industry', value)}
                  >
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
                    defaultValue={startup.stage}
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your startup idea..."
                  rows={6}
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}