export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          created_at: string;
          cause: 'General Education' | 'Educate a Child' | 'Support a Classroom' | 'Support a Child: KG to Matric';
          frequency: 'once' | 'monthly';
          currency: 'PKR' | 'AED';
          amount: number;
          donation_type: 'General' | 'Zakat' | 'Sadqah';
          country: string;
          donor_name: string | null;
          donor_email: string | null;
          donor_phone: string | null;
          status: 'pending' | 'completed' | 'failed';
          payment_reference: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          cause: 'General Education' | 'Educate a Child' | 'Support a Classroom' | 'Support a Child: KG to Matric';
          frequency: 'once' | 'monthly';
          currency: 'PKR' | 'AED';
          amount: number;
          donation_type: 'General' | 'Zakat' | 'Sadqah';
          country: string;
          donor_name?: string | null;
          donor_email?: string | null;
          donor_phone?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          payment_reference?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          cause?: 'General Education' | 'Educate a Child' | 'Support a Classroom' | 'Support a Child: KG to Matric';
          frequency?: 'once' | 'monthly';
          currency?: 'PKR' | 'AED';
          amount?: number;
          donation_type?: 'General' | 'Zakat' | 'Sadqah';
          country?: string;
          donor_name?: string | null;
          donor_email?: string | null;
          donor_phone?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          payment_reference?: string | null;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: 'new' | 'read' | 'archived';
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: 'new' | 'read' | 'archived';
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          status?: 'new' | 'read' | 'archived';
        };
      };
      volunteer_signups: {
        Row: {
          id: string;
          created_at: string;
          type: 'general' | 'university_chapter' | 'city_chapter';
          full_name: string;
          email: string;
          phone: string;
          city: string;
          university: string | null;
          message: string | null;
          status: 'new' | 'contacted' | 'archived';
        };
        Insert: {
          id?: string;
          created_at?: string;
          type: 'general' | 'university_chapter' | 'city_chapter';
          full_name: string;
          email: string;
          phone: string;
          city: string;
          university?: string | null;
          message?: string | null;
          status?: 'new' | 'contacted' | 'archived';
        };
        Update: {
          id?: string;
          created_at?: string;
          type?: 'general' | 'university_chapter' | 'city_chapter';
          full_name?: string;
          email?: string;
          phone?: string;
          city?: string;
          university?: string | null;
          message?: string | null;
          status?: 'new' | 'contacted' | 'archived';
        };
      };
      schools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          campus_type: string;
          shift: string;
          city: string;
          province: string;
          area_sq_ft: number;
          classrooms: number;
          student_capacity: number;
          current_students: number;
          established_year: number;
          description: string;
          facilities: Json;
          card_image: string;
          hero_image: string;
          gallery_images: Json;
          featured: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          campus_type?: string;
          shift?: string;
          city: string;
          province: string;
          area_sq_ft?: number;
          classrooms?: number;
          student_capacity?: number;
          current_students?: number;
          established_year?: number;
          description: string;
          facilities?: Json;
          card_image: string;
          hero_image: string;
          gallery_images?: Json;
          featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          campus_type?: string;
          shift?: string;
          city?: string;
          province?: string;
          area_sq_ft?: number;
          classrooms?: number;
          student_capacity?: number;
          current_students?: number;
          established_year?: number;
          description?: string;
          facilities?: Json;
          card_image?: string;
          hero_image?: string;
          gallery_images?: Json;
          featured?: boolean;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          excerpt: string;
          body: string;
          cover_image_url: string;
          author_name: string;
          author_role: string;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          category: string;
          excerpt: string;
          body: string;
          cover_image_url: string;
          author_name?: string;
          author_role?: string;
          published_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: string;
          excerpt?: string;
          body?: string;
          cover_image_url?: string;
          author_name?: string;
          author_role?: string;
          published_at?: string;
          created_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          head_office_address: string;
          contact_person: string | null;
          telephone: string;
          mobile: string;
          whatsapp: string;
          email: string;
          secondary_email: string | null;
          toll_free: string;
          facebook_url: string;
          instagram_url: string;
          youtube_url: string;
          tiktok_url: string | null;
          twitter_url: string;
          linkedin_url: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          head_office_address?: string;
          contact_person?: string | null;
          telephone?: string;
          mobile?: string;
          whatsapp?: string;
          email?: string;
          secondary_email?: string | null;
          toll_free?: string;
          facebook_url?: string;
          instagram_url?: string;
          youtube_url?: string;
          tiktok_url?: string | null;
          twitter_url?: string;
          linkedin_url?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          head_office_address?: string;
          contact_person?: string | null;
          telephone?: string;
          mobile?: string;
          whatsapp?: string;
          email?: string;
          secondary_email?: string | null;
          toll_free?: string;
          facebook_url?: string;
          instagram_url?: string;
          youtube_url?: string;
          tiktok_url?: string | null;
          twitter_url?: string;
          linkedin_url?: string;
          updated_at?: string;
        };
      };
      smtp_settings: {
        Row: {
          id: string;
          host: string;
          port: number;
          secure: boolean;
          user_name: string;
          password: string;
          from_name: string;
          from_email: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host: string;
          port: number;
          secure?: boolean;
          user_name: string;
          password: string;
          from_name: string;
          from_email: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host?: string;
          port?: number;
          secure?: boolean;
          user_name?: string;
          password?: string;
          from_name?: string;
          from_email?: string;
          updated_at?: string;
        };
      };
      admin_security: {
        Row: {
          id: string;
          admin_email: string;
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          recovery_codes: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_email: string;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          recovery_codes?: string[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_email?: string;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          recovery_codes?: string[];
          updated_at?: string;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
}
