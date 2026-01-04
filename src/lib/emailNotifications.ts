import { supabase } from "@/integrations/supabase/client";

// Event names matching n8n workflow
type EmailEventName = 
  | 'interest_accepted'
  | 'talent_added_to_team'
  | 'connection_request'
  | 'connection_accepted'
  | 'startup_update'
  | 'profile_incomplete_reminder'
  | 'pending_connection_reminder'
  | 'chat_followup_reminder';

interface N8NEmailPayload {
  event_name: EmailEventName;
  to_email: string;
  subject: string;
  dynamic_data: Record<string, any>;
}

const DEBUG_MODE = import.meta.env.VITE_EMAIL_DEBUG === 'true';
const WEBHOOK_URL = import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL;
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[EMAIL DEBUG] ${message}`, data ?? '');
  }
}

// Helper to get user emails from auth system via edge function
export async function getUserEmails(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  
  try {
    debugLog('Fetching emails for user IDs:', userIds);
    
    const { data, error } = await supabase.functions.invoke('get-user-emails', {
      body: { user_ids: userIds },
    });

    if (error) {
      console.error('Failed to fetch user emails:', error);
      return {};
    }

    debugLog('Fetched emails:', data?.emails);
    return data?.emails ?? {};
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return {};
  }
}

/**
 * Core function to send email via n8n webhook
 * Uses fetch with no-cors to handle CORS properly
 */
export async function sendEmailNotification(payload: N8NEmailPayload): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.error('[EMAIL ERROR] VITE_N8N_EMAIL_WEBHOOK_URL is not configured');
    return false;
  }

  debugLog('Sending email notification:', payload);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    debugLog('Webhook response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response body');
      console.error(`[EMAIL ERROR] Webhook failed with status ${response.status}:`, errorText);
      return false;
    }

    const result = await response.json().catch(() => ({ success: true }));
    debugLog('Webhook response:', result);
    
    console.log('[EMAIL] Notification sent successfully:', payload.event_name);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send notification:', error);
    return false;
  }
}

/**
 * Notify talent when their interest is accepted by a founder
 */
export async function notifyInterestAccepted(
  talentId: string,
  talentName: string,
  startupName: string,
  founderName: string,
  startupId: string
): Promise<boolean> {
  const emails = await getUserEmails([talentId]);
  const talentEmail = emails[talentId];
  
  if (!talentEmail) {
    console.warn('[EMAIL] Could not find email for talent:', talentId);
    return false;
  }

  return sendEmailNotification({
    event_name: 'interest_accepted',
    to_email: talentEmail,
    subject: `🚀 You've been accepted into ${startupName} on CollabHub!`,
    dynamic_data: {
      talent_name: talentName,
      startup_name: startupName,
      founder_name: founderName,
      startup_link: `${APP_URL}/startups/${startupId}`,
      chat_link: `${APP_URL}/messages`,
    },
  });
}

/**
 * Notify talent when they are added to a startup team
 */
export async function notifyTalentAddedToTeam(
  talentId: string,
  talentName: string,
  startupName: string,
  role: string | null,
  startupId: string
): Promise<boolean> {
  const emails = await getUserEmails([talentId]);
  const talentEmail = emails[talentId];
  
  if (!talentEmail) {
    console.warn('[EMAIL] Could not find email for talent:', talentId);
    return false;
  }

  return sendEmailNotification({
    event_name: 'talent_added_to_team',
    to_email: talentEmail,
    subject: `🎉 You've joined ${startupName} on CollabHub!`,
    dynamic_data: {
      talent_name: talentName,
      startup_name: startupName,
      role: role || 'Team Member',
      startup_link: `${APP_URL}/startups/${startupId}`,
    },
  });
}

/**
 * Notify user when they receive a connection request
 */
export async function notifyConnectionRequest(
  receiverId: string,
  receiverName: string,
  senderName: string,
  senderId: string
): Promise<boolean> {
  const emails = await getUserEmails([receiverId]);
  const receiverEmail = emails[receiverId];
  
  if (!receiverEmail) {
    console.warn('[EMAIL] Could not find email for receiver:', receiverId);
    return false;
  }

  return sendEmailNotification({
    event_name: 'connection_request',
    to_email: receiverEmail,
    subject: `👋 ${senderName} wants to connect with you on CollabHub`,
    dynamic_data: {
      receiver_name: receiverName,
      sender_name: senderName,
      profile_link: `${APP_URL}/profile/${senderId}`,
    },
  });
}

/**
 * Notify user when their connection request is accepted
 */
export async function notifyConnectionAccepted(
  requesterId: string,
  requesterName: string,
  accepterName: string,
  accepterId: string
): Promise<boolean> {
  const emails = await getUserEmails([requesterId]);
  const requesterEmail = emails[requesterId];
  
  if (!requesterEmail) {
    console.warn('[EMAIL] Could not find email for requester:', requesterId);
    return false;
  }

  return sendEmailNotification({
    event_name: 'connection_accepted',
    to_email: requesterEmail,
    subject: `🤝 ${accepterName} accepted your connection request!`,
    dynamic_data: {
      requester_name: requesterName,
      accepter_name: accepterName,
      profile_link: `${APP_URL}/profile/${accepterId}`,
      chat_link: `${APP_URL}/messages`,
    },
  });
}

/**
 * Notify interested talents and team members about a startup update
 */
export async function notifyStartupUpdate(
  recipientIds: string[],
  startupName: string,
  updateTitle: string,
  updateSummary: string | null,
  startupId: string,
  mediaUrl?: string | null
): Promise<void> {
  if (recipientIds.length === 0) return;
  
  const emails = await getUserEmails(recipientIds);
  
  // Send emails in parallel (non-blocking)
  const promises = Object.entries(emails).map(([userId, email]) =>
    sendEmailNotification({
      event_name: 'startup_update',
      to_email: email,
      subject: `📢 New update from ${startupName}`,
      dynamic_data: {
        startup_name: startupName,
        update_title: updateTitle,
        update_summary: updateSummary || '',
        startup_link: `${APP_URL}/startups/${startupId}`,
        media_url: mediaUrl || null,
      },
    })
  );

  // Don't await - let emails send in background
  Promise.all(promises).catch(console.error);
}

// ============ CRON-READY REMINDER FUNCTIONS ============
// These can be called from Supabase Edge Functions or scheduled tasks

/**
 * Send profile incomplete reminder (for cron jobs)
 */
export async function sendProfileIncompleteReminder(
  userId: string,
  userName: string,
  missingFields: string[]
): Promise<boolean> {
  const emails = await getUserEmails([userId]);
  const userEmail = emails[userId];
  
  if (!userEmail) return false;

  return sendEmailNotification({
    event_name: 'profile_incomplete_reminder',
    to_email: userEmail,
    subject: '⏰ Complete your CollabHub profile',
    dynamic_data: {
      user_name: userName,
      missing_fields: missingFields.join(', '),
      profile_link: `${APP_URL}/profile/edit`,
    },
  });
}

/**
 * Send pending connection reminder (for cron jobs)
 */
export async function sendPendingConnectionReminder(
  receiverId: string,
  receiverName: string,
  pendingCount: number
): Promise<boolean> {
  const emails = await getUserEmails([receiverId]);
  const receiverEmail = emails[receiverId];
  
  if (!receiverEmail) return false;

  return sendEmailNotification({
    event_name: 'pending_connection_reminder',
    to_email: receiverEmail,
    subject: `📬 You have ${pendingCount} pending connection request(s)`,
    dynamic_data: {
      receiver_name: receiverName,
      pending_count: pendingCount,
      network_link: `${APP_URL}/network`,
    },
  });
}

/**
 * Send chat follow-up reminder (for cron jobs)
 */
export async function sendChatFollowupReminder(
  userId: string,
  userName: string,
  otherUserName: string,
  conversationId: string
): Promise<boolean> {
  const emails = await getUserEmails([userId]);
  const userEmail = emails[userId];
  
  if (!userEmail) return false;

  return sendEmailNotification({
    event_name: 'chat_followup_reminder',
    to_email: userEmail,
    subject: `💬 ${otherUserName} is waiting for your reply`,
    dynamic_data: {
      user_name: userName,
      other_user_name: otherUserName,
      chat_link: `${APP_URL}/messages`,
    },
  });
}
