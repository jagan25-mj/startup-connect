import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, Profile } from '@/types/database';
import { useAuth } from './useAuth';

export function useMessages(conversationId?: string) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Optimized query: fetch messages in single query to avoid N+1
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_one_profile:profiles!conversations_participant_one_fkey(id, full_name, avatar_url, role),
        participant_two_profile:profiles!conversations_participant_two_fkey(id, full_name, avatar_url, role),
        messages(id, read, sender_id, created_at, content)
      `)
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const processedConversations = data.map((conv: any) => {
        const otherParticipant =
          conv.participant_one === user.id
            ? conv.participant_two_profile
            : conv.participant_one_profile;

        // Calculate unread count and find last message from already-fetched data
        const unreadCount = (conv.messages || []).filter(
          (m: any) => !m.read && m.sender_id !== user.id
        ).length;

        const lastMessage = (conv.messages || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        [0] || null;

        return {
          ...conv,
          other_participant: otherParticipant as Profile,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      });

      setConversations(processedConversations);
      setTotalUnread(processedConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0));
    }
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('read', false);
      }
    }
  }, [conversationId, user]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user) return false;

    // Validate content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return false;
    }

    // Check length limit
    if (trimmedContent.length > 5000) {
      console.warn('Message too long, truncating');
      return false;
    }

    // Check rate limit
    const { checkRateLimit, logSecurityEvent } = await import('@/lib/security');
    const rateLimitResult = await checkRateLimit(user.id, 'message_send');

    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', {
        action: 'message_send',
        userId: user.id
      });
      return false;
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmedContent,
    });

    return !error;
  };

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      other_user_id: otherUserId,
    });

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as Message]);

            // Mark as read if not sender
            if (user && data.sender_id !== user.id) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', data.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Real-time subscription for conversations list
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    totalUnread,
    sendMessage,
    startConversation,
    refetchConversations: fetchConversations,
    refetchMessages: fetchMessages,
  };
}
