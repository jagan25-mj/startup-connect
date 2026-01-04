import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useConnections } from '@/hooks/useConnections';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, UserCheck, Clock, UserMinus, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConnectButtonProps {
  userId: string;
  userName: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function ConnectButton({
  userId,
  userName,
  size = 'md',
  variant = 'outline',
  className = '',
}: ConnectButtonProps) {
  const { user } = useAuth();
  const {
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    removeConnection,
    getConnectionStatus,
    getConnectionId,
  } = useConnections();
  const [loading, setLoading] = useState(false);

  // Don't show button for own profile
  if (user?.id === userId) return null;

  const status = getConnectionStatus(userId);
  const connectionId = getConnectionId(userId);

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6',
  };

  const handleConnect = async () => {
    setLoading(true);
    await sendConnectionRequest(userId);
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!connectionId) return;
    setLoading(true);
    await acceptConnection(connectionId);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!connectionId) return;
    setLoading(true);
    await rejectConnection(connectionId);
    setLoading(false);
  };

  const handleRemove = async () => {
    if (!connectionId) return;
    setLoading(true);
    await removeConnection(connectionId);
    setLoading(false);
  };

  if (loading) {
    return (
      <Button variant={variant} disabled className={`${sizeClasses[size]} ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (status === 'connected') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`${sizeClasses[size]} ${className} text-success border-success/30`}>
            <UserCheck className="h-4 w-4 mr-2" />
            Connected
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRemove} className="text-destructive">
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Connection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === 'pending_sent') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`${sizeClasses[size]} ${className} text-muted-foreground`}>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRemove} className="text-destructive">
            <UserMinus className="h-4 w-4 mr-2" />
            Cancel Request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <Button
          variant="gradient"
          onClick={handleAccept}
          className={sizeClasses[size]}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          onClick={handleReject}
          className={sizeClasses[size]}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={handleConnect}
      className={`${sizeClasses[size]} ${className}`}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      Connect
    </Button>
  );
}
