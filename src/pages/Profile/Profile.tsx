import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Edit, Calendar, Lightbulb, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { profile } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="animate-fade-in overflow-hidden">
          {/* Header/Banner */}
          <div className="h-32 gradient-primary" />
          
          {/* Profile Content */}
          <CardContent className="relative pt-0 -mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <Badge 
                    variant="secondary" 
                    className={profile.role === 'founder' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent/10 text-accent'
                    }
                  >
                    {profile.role === 'founder' ? (
                      <><Lightbulb className="mr-1 h-3 w-3" /> Founder</>
                    ) : (
                      <><Users className="mr-1 h-3 w-3" /> Talent</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                </div>
              </div>
              
              <Button asChild variant="outline">
                <Link to="/profile/edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {/* Bio */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic">No bio added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No skills added yet</p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
