import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MessagesBadge } from '@/components/messages/MessagesBadge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Rocket, User, LogOut, LayoutDashboard, Plus } from 'lucide-react';


export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">LaunchPad</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link 
            to="/startups" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore Startups
          </Link>
          {user && (
            <Link 
              to={profile?.role === 'investor' ? '/investor-dashboard' : '/dashboard'}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {profile?.role === 'investor' ? 'Investor Dashboard' : 'Dashboard'}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <MessagesBadge />
              <NotificationBell />
              {profile?.role === 'founder' && (
                <Button asChild variant="gradient" size="sm" className="hidden sm:flex">
                  <Link to="/startups/create">
                    <Plus className="h-4 w-4" />
                    New Startup
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-3 p-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={profile?.role === 'investor' ? '/investor-dashboard' : '/dashboard'} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {profile?.role === 'investor' ? 'Investor Dashboard' : 'Dashboard'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link to="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
