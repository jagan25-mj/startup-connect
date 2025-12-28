import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StartChatButtonProps {
  userId: string;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function StartChatButton({
  userId,
  userName,
  variant = 'outline',
  size = 'default',
  className,
}: StartChatButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Please sign in to send messages');
      navigate('/auth/login');
      return;
    }

    if (user.id === userId) {
      toast.error("You can't message yourself");
      return;
    }

    setLoading(true);
    const conversationId = await startConversation(userId);
    setLoading(false);

    if (conversationId) {
      navigate(`/messages/${conversationId}`);
    } else {
      toast.error('Failed to start conversation');
    }
  };

  // Don't show button for own profile
  if (user?.id === userId) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartChat}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </>
      )}
    </Button>
  );
}
