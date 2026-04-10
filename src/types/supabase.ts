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
          region_code: string | null
          stripe_customer_id: string | null
          notification_preferences: Json | null
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
          region_code?: string | null
          stripe_customer_id?: string | null
          notification_preferences?: Json | null
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
          region_code?: string | null
          stripe_customer_id?: string | null
          notification_preferences?: Json | null
        }
        Relationships: []
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
          membership_tier: 'starter' | 'growth' | 'pro'
          is_hiring: boolean
          is_mentoring: boolean
          region_code: string
          email: string | null
          phone: string | null
          photo_url: string | null
          video_url: string | null
          seo_keywords: string | null
          created_at: string
          updated_at: string
          profile_views: number
          patient_leads: number
          average_case_value: number | null
          referral_code: string | null
          referred_by: string | null
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
          phone?: string | null
          photo_url?: string | null
          video_url?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
          profile_views?: number
          patient_leads?: number
          average_case_value?: number | null
          referral_code?: string | null
          referred_by?: string | null
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
          phone?: string | null
          photo_url?: string | null
          video_url?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
          profile_views?: number
          patient_leads?: number
          average_case_value?: number | null
          referral_code?: string | null
          referred_by?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          school: string | null
          graduation_year: number | null
          location_city: string | null
          region_code: string
          interests: string[] | null
          skills: string[] | null
          is_looking_for_mentorship: boolean
          resume_url: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          school?: string | null
          graduation_year?: number | null
          location_city?: string | null
          region_code?: string
          interests?: string[] | null
          skills?: string[] | null
          is_looking_for_mentorship?: boolean
          resume_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          school?: string | null
          graduation_year?: number | null
          location_city?: string | null
          region_code?: string
          interests?: string[] | null
          skills?: string[] | null
          is_looking_for_mentorship?: boolean
          resume_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Relationships: []
      }
      seminars: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string
          dates: string
          location: string | null
          city: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          registration_link: string | null
          price: number | null
          max_capacity: number | null
          listing_tier: string
          target_audience: string[] | null
          tags: string[] | null
          payment_status: string
          is_approved: boolean
          host_type_at_submission: string | null
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description: string
          dates: string
          location?: string | null
          city?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          registration_link?: string | null
          price?: number | null
          max_capacity?: number | null
          listing_tier?: string
          target_audience?: string[] | null
          tags?: string[] | null
          payment_status?: string
          is_approved?: boolean
          host_type_at_submission?: string | null
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string
          dates?: string
          location?: string | null
          city?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          registration_link?: string | null
          price?: number | null
          max_capacity?: number | null
          listing_tier?: string
          target_audience?: string[] | null
          tags?: string[] | null
          payment_status?: string
          is_approved?: boolean
          host_type_at_submission?: string | null
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          name: string
          slug: string | null
          website_url: string | null
          short_description: string | null
          full_description: string | null
          categories: string[] | null
          tier: string
          discount_code: string | null
          discount_description: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          slug?: string | null
          website_url?: string | null
          short_description?: string | null
          full_description?: string | null
          categories?: string[] | null
          tier?: string
          discount_code?: string | null
          discount_description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          website_url?: string | null
          short_description?: string | null
          full_description?: string | null
          categories?: string[] | null
          tier?: string
          discount_code?: string | null
          discount_description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          location: string | null
          role: string | null
          source: string | null
          doctor_id: string | null
          status: string | null
          metadata: Json | null
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          first_name?: string | null
          location?: string | null
          role?: string | null
          source?: string | null
          doctor_id?: string | null
          status?: string | null
          metadata?: Json | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          location?: string | null
          role?: string | null
          source?: string | null
          doctor_id?: string | null
          status?: string | null
          metadata?: Json | null
          confirmed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: string | null
          link: string | null
          priority: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type?: string | null
          link?: string | null
          priority?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          type?: string | null
          link?: string | null
          priority?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          email_enabled: boolean
          sms_enabled: boolean
          push_enabled: boolean
          referral_alerts: boolean
          job_alerts: boolean
          marketing_emails: boolean
        }
        Insert: {
          user_id: string
          email_enabled?: boolean
          sms_enabled?: boolean
          push_enabled?: boolean
          referral_alerts?: boolean
          job_alerts?: boolean
          marketing_emails?: boolean
        }
        Update: {
          user_id?: string
          email_enabled?: boolean
          sms_enabled?: boolean
          push_enabled?: boolean
          referral_alerts?: boolean
          job_alerts?: boolean
          marketing_emails?: boolean
        }
        Relationships: []
      }
      automation_queue: {
        Row: {
          id: string
          event_type: string
          payload: Json
          status: string
          scheduled_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          payload: Json
          status?: string
          scheduled_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          payload?: Json
          status?: string
          scheduled_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          id: string
          doctor_id: string
          title: string
          description: string | null
          type: string | null
          salary_min: number | null
          salary_max: number | null
          benefits: string[] | null
          requirements: string[] | null
          status: string
          category: string | null
          employment_type: string | null
          apply_method: string | null
          apply_url: string | null
          expires_at: string | null
          city: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          title: string
          description?: string | null
          type?: string | null
          salary_min?: number | null
          salary_max?: number | null
          benefits?: string[] | null
          requirements?: string[] | null
          status?: string
          category?: string | null
          employment_type?: string | null
          apply_method?: string | null
          apply_url?: string | null
          expires_at?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          title?: string
          description?: string | null
          type?: string | null
          salary_min?: number | null
          salary_max?: number | null
          benefits?: string[] | null
          requirements?: string[] | null
          status?: string
          category?: string | null
          employment_type?: string | null
          apply_method?: string | null
          apply_url?: string | null
          expires_at?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          stage: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          stage?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          stage?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          applicant_id: string
          job_id: string
          applicant_name: string | null
          applicant_email: string | null
          applicant_phone: string | null
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          applicant_id?: string
          job_id: string
          applicant_name?: string | null
          applicant_email?: string | null
          applicant_phone?: string | null
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          applicant_id?: string
          job_id?: string
          applicant_name?: string | null
          applicant_email?: string | null
          applicant_phone?: string | null
          message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      seminar_registrations: {
        Row: {
          id: string
          seminar_id: string
          amount_paid: number | null
          payment_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          seminar_id: string
          amount_paid?: number | null
          payment_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          seminar_id?: string
          amount_paid?: number | null
          payment_status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant_one_id: string
          participant_two_id: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_one_id: string
          participant_two_id: string
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          participant_one_id?: string
          participant_two_id?: string
          last_message_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          body: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          recipient_id?: string
          body?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          audience_type: string | null
          priority: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          audience_type?: string | null
          priority?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          audience_type?: string | null
          priority?: string | null
          created_at?: string
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          id: string
          user_id: string
          announcement_id: string
        }
        Insert: {
          id?: string
          user_id: string
          announcement_id: string
        }
        Update: {
          id?: string
          user_id?: string
          announcement_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          recipient_id: string
          patient_name: string | null
          notes: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          recipient_id: string
          patient_name?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          recipient_id?: string
          patient_name?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      doctor_connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      market_benchmarks: {
        Row: {
          id: string
          role_type: string
          region_code: string
          avg_salary_min: number | null
          avg_salary_max: number | null
          common_benefits: string[] | null
        }
        Insert: {
          id?: string
          role_type: string
          region_code: string
          avg_salary_min?: number | null
          avg_salary_max?: number | null
          common_benefits?: string[] | null
        }
        Update: {
          id?: string
          role_type?: string
          region_code?: string
          avg_salary_min?: number | null
          avg_salary_max?: number | null
          common_benefits?: string[] | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          doctor_id: string
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          event_type: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          event_type?: string
          created_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          user_id: string
          title: string | null
          analysis_results: Json | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          analysis_results?: Json | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          analysis_results?: Json | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          energy_level: number | null
          pain_level: number | null
          sleep_quality: number | null
          notes: string | null
          log_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          energy_level?: number | null
          pain_level?: number | null
          sleep_quality?: number | null
          notes?: string | null
          log_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          energy_level?: number | null
          pain_level?: number | null
          sleep_quality?: number | null
          notes?: string | null
          log_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      patient_stories: {
        Row: {
          id: string
          doctor_id: string
          patient_first_name: string
          condition_before: string
          outcome_after: string
          story_text: string
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_first_name: string
          condition_before: string
          outcome_after: string
          story_text: string
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_first_name?: string
          condition_before?: string
          outcome_after?: string
          story_text?: string
          approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          modules: Json
          tier_required: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          modules?: Json
          tier_required?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          modules?: Json
          tier_required?: string
          created_at?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          completed_modules: Json
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          completed_modules?: Json
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          completed_modules?: Json
          started_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      host_profiles: {
        Row: {
          id: string
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          is_verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          id: string
          user_id: string
          marketing_opt_in: boolean
          has_bounced: boolean
          has_complained: boolean
        }
        Insert: {
          id?: string
          user_id: string
          marketing_opt_in?: boolean
          has_bounced?: boolean
          has_complained?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          marketing_opt_in?: boolean
          has_bounced?: boolean
          has_complained?: boolean
        }
        Relationships: []
      }
      processed_webhooks: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          subject: string | null
          segment_targeted: string | null
          sent_by: string | null
          total_sent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          subject?: string | null
          segment_targeted?: string | null
          sent_by?: string | null
          total_sent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string | null
          segment_targeted?: string | null
          sent_by?: string | null
          total_sent?: number | null
          created_at?: string
        }
        Relationships: []
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
      increment_vendor_stats: {
        Args: {
          vendor_id: string
          stat_column: string
        }
        Returns: void
      }
      refresh_search_index: {
        Args: Record<string, never>
        Returns: void
      }
      get_reciprocity_candidates: {
        Args: {
          p_user_id: string
          p_lat: number
          p_lng: number
          p_radius_miles: number
        }
        Returns: {
          id: string
          first_name: string
          last_name: string
          clinic_name: string
          city: string
          state: string
          latitude: number
          longitude: number
          distance_miles: number
        }[]
      }
      increment_doctor_views: {
        Args: {
          doctor_slug: string
        }
        Returns: void
      }
      increment_seminar_stats: {
        Args: {
          seminar_id: string
          stat_column: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
