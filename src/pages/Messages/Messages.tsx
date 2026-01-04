import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Send, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, messages, loading, sendMessage } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, 'h:mm a');
    } else if (isYesterday(d)) {
      return 'Yesterday ' + format(d, 'h:mm a');
    }
    return format(d, 'MMM d, h:mm a');
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.other_participant?.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversations.find((c) => c.id === conversationId);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className={cn(
            "flex flex-col border rounded-lg bg-card",
            conversationId ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Start chatting by visiting a startup or profile
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    className={cn(
                      "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b",
                      conversationId === conv.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={getAvatarUrl(conv.other_participant?.avatar_url)} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.other_participant?.full_name
                          ? getInitials(conv.other_participant.full_name)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conv.other_participant?.full_name}
                        </p>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message.created_at), {
                              addSuffix: false,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.content || 'No messages yet'}
                        </p>
                        {(conv.unread_count || 0) > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "md:col-span-2 flex flex-col border rounded-lg bg-card",
            !conversationId ? "hidden md:flex" : "flex"
          )}>
            {conversationId && currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => navigate('/messages')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Link to={`/profile/${currentConversation.other_participant?.id}`}>
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
                      <AvatarImage
                        src={getAvatarUrl(currentConversation.other_participant?.avatar_url)}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {currentConversation.other_participant?.full_name
                          ? getInitials(currentConversation.other_participant.full_name)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link 
                      to={`/profile/${currentConversation.other_participant?.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {currentConversation.other_participant?.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">
                      {currentConversation.other_participant?.role}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id;
                      const showAvatar =
                        index === 0 ||
                        messages[index - 1].sender_id !== message.sender_id;

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && showAvatar && (
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarImage src={getAvatarUrl(message.sender?.avatar_url)} />
                              <AvatarFallback className="text-xs bg-muted">
                                {message.sender?.full_name
                                  ? getInitials(message.sender.full_name)
                                  : '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwn && !showAvatar && <div className="w-8" />}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={cn(
                                "text-[10px] mt-1",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      maxLength={2000}
                      disabled={sending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium text-lg mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
