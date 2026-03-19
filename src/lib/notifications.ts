import { createServerSupabase } from "./supabase-server";

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  type: 'referral' | 'job' | 'system' | 'reminder' | 'announcement';
  priority?: 'info' | 'important' | 'urgent';
  link?: string;
  metadata?: any;
};

export async function sendNotification(payload: NotificationPayload) {
  const supabase = createServerSupabase();

  const { data, error } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      priority: payload.priority || 'info',
      link: payload.link,
      metadata: payload.metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }

  // Check if push is enabled for this user
  const { data: prefs } = await (supabase as any)
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', payload.userId)
    .single();

  if (prefs?.push_enabled) {
    // Trigger push notification via API
    // In a real scenario, you'd call a internal API or a queue
    // For now, we'll assume there's a push worker listening
  }

  return { success: true, data };
}

export async function broadcastAnnouncement(announcementId: string) {
  // This would typically trigger push notifications for the entire target audience
  // Logic for batch processing push notifications would go here
}
