
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
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_value: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          id: string
          created_at: string
          reference_id: string
          user_id: string
          package_type: string
          package_name: string
          amount: string
          image_credits: number
          video_credits: number
          screenshot_url: string
          email: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          reference_id: string
          user_id: string
          package_type: string
          package_name: string
          amount: string
          image_credits: number
          video_credits: number
          screenshot_url: string
          email: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          reference_id?: string
          user_id?: string
          package_type?: string
          package_name?: string
          amount?: string
          image_credits?: number
          video_credits?: number
          screenshot_url?: string
          email?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_content_history: {
        Row: {
          content_type: string
          content_url: string
          created_at: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          prompt: string | null
          user_id: string
        }
        Insert: {
          content_type: string
          content_url: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          prompt?: string | null
          user_id: string
        }
        Update: {
          content_type?: string
          content_url?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          prompt?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updateables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Type definitions for payment requests
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row']
export type InsertPaymentRequest = Database['public']['Tables']['payment_requests']['Insert']
export type UpdatePaymentRequest = Database['public']['Tables']['payment_requests']['Update']
