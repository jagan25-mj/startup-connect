import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { MessageSquare } from 'lucide-react';

export function MessagesBadge() {
  const { totalUnread } = useMessages();

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link to="/messages">
        <MessageSquare className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </Link>
    </Button>
  );
}
