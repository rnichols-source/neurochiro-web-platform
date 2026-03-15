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
          membership_tier: 'starter' | 'growth' | 'pro'
          is_hiring: boolean
          is_mentoring: boolean
          region_code: string
          email: string | null
          photo_url: string | null
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
          membership_tier?: 'starter' | 'growth' | 'pro'
          is_hiring?: boolean
          is_mentoring?: boolean
          region_code?: string
          email?: string | null
          photo_url?: string | null
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
          membership_tier?: 'starter' | 'growth' | 'pro'
          is_hiring?: boolean
          is_mentoring?: boolean
          region_code?: string
          email?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          profile_views?: number
          patient_leads?: number
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
