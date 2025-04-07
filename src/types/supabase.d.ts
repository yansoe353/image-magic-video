
export interface PaymentRequest {
  id: string;
  created_at: string;
  reference_id: string;
  user_id: string;
  package_type: "images" | "videos" | "combo";
  package_name: string;
  amount: string;
  image_credits: number;
  video_credits: number;
  screenshot_url: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string;
          id: string;
          key_name: string;
          key_value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key_name: string;
          key_value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key_name?: string;
          key_value?: string;
        };
      };
      user_content_history: {
        Row: {
          content_type: string;
          content_url: string;
          created_at: string;
          id: string;
          is_public: boolean;
          metadata: any;
          prompt: string;
          user_id: string;
        };
        Insert: {
          content_type: string;
          content_url: string;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          metadata?: any;
          prompt?: string;
          user_id: string;
        };
        Update: {
          content_type?: string;
          content_url?: string;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          metadata?: any;
          prompt?: string;
          user_id?: string;
        };
      };
      payment_requests: {
        Row: {
          id: string;
          created_at: string;
          reference_id: string;
          user_id: string;
          package_type: string;
          package_name: string;
          amount: string;
          image_credits: number;
          video_credits: number;
          screenshot_url: string;
          email: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          reference_id: string;
          user_id: string;
          package_type: string;
          package_name: string;
          amount: string;
          image_credits: number;
          video_credits: number;
          screenshot_url: string;
          email: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          reference_id?: string;
          user_id?: string;
          package_type?: string;
          package_name?: string;
          amount?: string;
          image_credits?: number;
          video_credits?: number;
          screenshot_url?: string;
          email?: string;
          status?: string;
        };
      };
    };
  };
}
