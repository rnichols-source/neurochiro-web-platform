export type UserRole = 'patient' | 'student' | 'doctor' | 'admin';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'free';
export type MembershipTier = 'starter' | 'growth' | 'pro';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  stripe_customer_id?: string;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id?: string; // Link to UserProfile
  slug: string;
  first_name: string;
  last_name: string;
  clinic_name: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  address: string;
  latitude: number;
  longitude: number;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  bio: string;
  specialties: string[];
  google_place_id?: string;
  rating?: number;
  review_count?: number;
  verification_status: 'pending' | 'verified' | 'hidden';
  membership_tier: MembershipTier;
  is_hiring: boolean;
  is_mentoring: boolean;
  region_code: string;
  email?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id?: string; // Link to UserProfile
  first_name: string;
  last_name: string;
  school: string;
  graduation_year: number;
  interests: string[];
  is_looking_for_mentorship: boolean;
  region_code: string;
  match_rate?: number; // Calculated field
  engagement_score?: number; // Calculated field
}

export interface Job {
  id: string;
  doctor_id: string; // FK to Doctor
  title: string;
  description: string;
  location: string;
  type: 'associate' | 'independent_contractor' | 'buy_in';
  salary_range?: string;
  status: 'open' | 'closed' | 'filled';
  region_code: string;
  posted_at: string;
}

export interface Seminar {
  id: string;
  host_id: string; // FK to Doctor or User
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  region_code: string;
  attendees_count?: number;
  image_url?: string;
}

export interface Specialty {
  id: string;
  name: string;
}
