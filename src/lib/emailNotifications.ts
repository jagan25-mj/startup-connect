/**
 * Email Notifications - INTENTIONALLY DISABLED FOR MVP
 * 
 * This module is stubbed out to reduce complexity and focus on core collaboration features.
 * All email notification logic has been removed. Only in-app notifications are active.
 * 
 * When re-enabling email notifications in the future:
 * 1. Configure VITE_N8N_EMAIL_WEBHOOK_URL environment variable
 * 2. Set up n8n workflows for each event type
 * 3. Implement the notification functions below
 * 
 * Event types that were previously supported:
 * - interest_accepted: When a founder accepts talent interest
 * - talent_added_to_team: When talent is added to a startup team
 * - connection_request: When a user sends a connection request
 * - connection_accepted: When a connection request is accepted
 * - startup_update: When a startup posts a progress update
 */

// Stub functions - do nothing, return immediately
// These maintain the function signatures for easy re-enablement

export async function notifyInterestAccepted(
  _talentId: string,
  _talentName: string,
  _startupName: string,
  _founderName: string,
  _startupId: string
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function notifyTalentAddedToTeam(
  _talentId: string,
  _talentName: string,
  _startupName: string,
  _role: string | null,
  _startupId: string
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function notifyConnectionRequest(
  _receiverId: string,
  _receiverName: string,
  _senderName: string,
  _senderId: string
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function notifyConnectionAccepted(
  _requesterId: string,
  _requesterName: string,
  _accepterName: string,
  _accepterId: string
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function notifyStartupUpdate(
  _recipientIds: string[],
  _startupName: string,
  _updateTitle: string,
  _updateSummary: string | null,
  _startupId: string,
  _mediaUrl?: string | null
): Promise<void> {
  // Email notifications disabled for MVP
}

export async function sendProfileIncompleteReminder(
  _userId: string,
  _userName: string,
  _missingFields: string[]
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function sendPendingConnectionReminder(
  _receiverId: string,
  _receiverName: string,
  _pendingCount: number
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}

export async function sendChatFollowupReminder(
  _userId: string,
  _userName: string,
  _otherUserName: string,
  _conversationId: string
): Promise<boolean> {
  // Email notifications disabled for MVP
  return true;
}
