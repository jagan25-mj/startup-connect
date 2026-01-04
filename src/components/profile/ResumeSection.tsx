import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';
import type { Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface ResumeSectionProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export function ResumeSection({ profile, isOwnProfile }: ResumeSectionProps) {
  const hasResume = profile.resume_url && profile.resume_filename;

  const getResumeUrl = () => {
    if (!profile.resume_url) return null;
    
    // Get public URL from Supabase storage
    const { data } = supabase.storage
      .from('resumes')
      .getPublicUrl(profile.resume_url);
    
    return data.publicUrl;
  };

  const resumeUrl = getResumeUrl();

  if (!hasResume && !isOwnProfile) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">No resume uploaded.</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasResume && isOwnProfile) {
    return null; // Will be handled in EditProfile
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{profile.resume_filename}</p>
              <p className="text-sm text-muted-foreground">PDF Document</p>
            </div>
          </div>
          <div className="flex gap-2">
            {resumeUrl && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={resumeUrl} download={profile.resume_filename}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}