export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          subscription_status: string
          tier: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_status?: string
          tier?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_status?: string
          tier?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string | null
          slug: string
          first_name: string
          last_name: string
          clinic_name: string
          city: string
          state: string
          country: string
          zip_code: string | null
          address: string
          latitude: number
          longitude: number
          instagram_url: string | null
          facebook_url: string | null
          website_url: string | null
          bio: string
          specialties: string[]
          google_place_id: string | null
          rating: number | null
          review_count: number | null
          verification_status: 'pending' | 'verified' | 'hidden'
          membership_tier: 'starter' | 'growth' | 'pro' | 'elite'
          is_hiring: boolean
          is_mentoring: boolean
          region_code: string
          email: string | null
          photo_url: string | null
          video_url: string | null
          seo_keywords: string | null
          created_at: string
          updated_at: string
          profile_views: number
          patient_leads: number
        }
        Insert: {
          id?: string
          user_id?: string | null
          slug: string
          first_name: string
          last_name: string
          clinic_name: string
          city?: string
          state?: string
          country?: string
          zip_code?: string | null
          address?: string
          latitude?: number
          longitude?: number
          instagram_url?: string | null
          facebook_url?: string | null
          website_url?: string | null
          bio?: string
          specialties?: string[]
          google_place_id?: string | null
          rating?: number | null
          review_count?: number | null
          verification_status?: 'pending' | 'verified' | 'hidden'
          membership_tier?: 'starter' | 'growth' | 'pro' | 'elite'
          is_hiring?: boolean
          is_mentoring?: boolean
          region_code?: string
          email?: string | null
          photo_url?: string | null
          video_url?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
          profile_views?: number
          patient_leads?: number
        }
        Update: {
          id?: string
          user_id?: string | null
          slug?: string
          first_name?: string
          last_name?: string
          clinic_name?: string
          city?: string
          state?: string
          country?: string
          zip_code?: string | null
          address?: string
          latitude?: number
          longitude?: number
          instagram_url?: string | null
          facebook_url?: string | null
          website_url?: string | null
          bio?: string
          specialties?: string[]
          google_place_id?: string | null
          rating?: number | null
          review_count?: number | null
          verification_status?: 'pending' | 'verified' | 'hidden'
          membership_tier?: 'starter' | 'growth' | 'pro' | 'elite'
          is_hiring?: boolean
          is_mentoring?: boolean
          region_code?: string
          email?: string | null
          photo_url?: string | null
          video_url?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
          profile_views?: number
          patient_leads?: number
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          school: string | null
          graduation_year: number | null
          location_city: string | null
          region_code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          school?: string | null
          graduation_year?: number | null
          location_city?: string | null
          region_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          school?: string | null
          graduation_year?: number | null
          location_city?: string | null
          region_code?: string
          created_at?: string
        }
      }
      seminars: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string
          date: string
          city: string | null
          country: string | null
          is_approved: boolean
          created_at: string
          listing_tier: string
          payment_status: string
          admin_notes: string | null
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description: string
          date: string
          city?: string | null
          country?: string | null
          is_approved?: boolean
          created_at?: string
          listing_tier?: string
          payment_status?: string
          admin_notes?: string | null
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string
          date?: string
          city?: string | null
          country?: string | null
          is_approved?: boolean
          created_at?: string
          listing_tier?: string
          payment_status?: string
          admin_notes?: string | null
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          website_url: string | null
          tier: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          website_url?: string | null
          tier?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          website_url?: string | null
          tier?: string
          is_active?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          category: string
          event: string
          user_name: string | null
          user_id: string | null
          target: string | null
          status: string | null
          severity: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          event: string
          user_name?: string | null
          user_id?: string | null
          target?: string | null
          status?: string | null
          severity?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          event?: string
          user_name?: string | null
          user_id?: string | null
          target?: string | null
          status?: string | null
          severity?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          doctor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_doctors: {
        Args: {
          p_search_query?: string
          p_region_code?: string
          p_min_lng?: number
          p_min_lat?: number
          p_max_lng?: number
          p_max_lat?: number
          p_page?: number
          p_limit?: number
        }
        Returns: {
          id: string
          first_name: string
          last_name: string
          clinic_name: string
          specialties: string[]
          slug: string
          bio: string
          rating: number
          review_count: number
          latitude: number
          longitude: number
          membership_tier: string
          verification_status: string
          total_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
