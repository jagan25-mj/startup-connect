import { supabase } from "@/integrations/supabase/client";

type EmailTemplate = 'interest_accepted' | 'connection_request' | 'connection_accepted' | 'startup_update';

interface EmailNotificationPayload {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

// Helper to get user emails from auth system
export async function getUserEmails(userIds: string[]): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.functions.invoke('get-user-emails', {
      body: { user_ids: userIds },
    });

    if (error) {
      console.error('Failed to fetch user emails:', error);
      return {};
    }

    return data?.emails ?? {};
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return {};
  }
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: payload,
    });

    if (error) {
      console.error('Email notification error:', error);
      return false;
    }

    console.log('Email notification sent:', data);
    return data?.success ?? false;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

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
    console.warn('Could not find email for talent:', talentId);
    return false;
  }

  return sendEmailNotification({
    to: talentEmail,
    subject: `🚀 You've been accepted into ${startupName} on CollabHub!`,
    template: 'interest_accepted',
    data: {
      talentName,
      startupName,
      founderName,
      ctaLink: `${APP_URL}/startups/${startupId}`,
    },
  });
}

export async function notifyConnectionRequest(
  receiverId: string,
  receiverName: string,
  senderName: string,
  senderId: string
): Promise<boolean> {
  const emails = await getUserEmails([receiverId]);
  const receiverEmail = emails[receiverId];
  
  if (!receiverEmail) {
    console.warn('Could not find email for receiver:', receiverId);
    return false;
  }

  return sendEmailNotification({
    to: receiverEmail,
    subject: `👋 ${senderName} wants to connect with you on CollabHub`,
    template: 'connection_request',
    data: {
      receiverName,
      senderName,
      ctaLink: `${APP_URL}/profile/${senderId}`,
    },
  });
}

export async function notifyConnectionAccepted(
  requesterId: string,
  requesterName: string,
  accepterName: string,
  accepterId: string
): Promise<boolean> {
  const emails = await getUserEmails([requesterId]);
  const requesterEmail = emails[requesterId];
  
  if (!requesterEmail) {
    console.warn('Could not find email for requester:', requesterId);
    return false;
  }

  return sendEmailNotification({
    to: requesterEmail,
    subject: `🤝 ${accepterName} accepted your connection request!`,
    template: 'connection_accepted',
    data: {
      requesterName,
      accepterName,
      ctaLink: `${APP_URL}/profile/${accepterId}`,
    },
  });
}

export async function notifyStartupUpdate(
  recipientIds: string[],
  startupName: string,
  updateTitle: string,
  updateSummary: string | null,
  startupId: string
): Promise<void> {
  if (recipientIds.length === 0) return;
  
  const emails = await getUserEmails(recipientIds);
  
  // Send emails in parallel (non-blocking)
  const promises = Object.entries(emails).map(([, email]) =>
    sendEmailNotification({
      to: email,
      subject: `📢 New update from ${startupName}`,
      template: 'startup_update',
      data: {
        startupName,
        updateTitle,
        updateSummary,
        ctaLink: `${APP_URL}/startups/${startupId}`,
      },
    })
  );

  // Don't await - let emails send in background
  Promise.all(promises).catch(console.error);
}
