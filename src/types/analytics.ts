import { MembershipTier } from "./directory";

export interface ROIStats {
  profile_views: number;
  contact_clicks: number;
  phone_taps: number;
  website_clicks: number;
  booking_clicks: number;
  message_requests: number;
  referrals_sent: number;
  confirmed_patients: number;
  average_case_value: number;
  membership_cost: number;
}

export interface ROIData {
  period: '7d' | '30d' | '90d' | 'ytd';
  tier: MembershipTier;
  stats: ROIStats;
  pending_patients?: { id: string; name: string; date: string }[];
  historical_revenue: { date: string; amount: number }[];
  patient_acquisition: { source: string; count: number }[];
}

export interface AnalyticsEvent {
  id: string;
  doctor_id: string;
  event_type: 'profile_view' | 'contact_click' | 'phone_tap' | 'website_click' | 'booking_click' | 'message_request' | 'referral_sent' | 'patient_confirmed';
  patient_id?: string;
  metadata?: any;
  created_at: string;
}
