export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      donor_profiles: {
        Row: {
          address: string | null
          created_at: string
          id: string
          organization_name: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_donations: {
        Row: {
          allergens: string | null
          available_until: string
          category: Database["public"]["Enums"]["food_category"]
          created_at: string
          description: string | null
          donor_id: string
          food_name: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          pickup_address: string
          preparation_time: string | null
          quantity: number
          quantity_unit: string
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          storage_method: Database["public"]["Enums"]["storage_method"]
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          available_until: string
          category?: Database["public"]["Enums"]["food_category"]
          created_at?: string
          description?: string | null
          donor_id: string
          food_name: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          pickup_address: string
          preparation_time?: string | null
          quantity: number
          quantity_unit?: string
          servings: number
          status?: Database["public"]["Enums"]["donation_status"]
          storage_method?: Database["public"]["Enums"]["storage_method"]
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          available_until?: string
          category?: Database["public"]["Enums"]["food_category"]
          created_at?: string
          description?: string | null
          donor_id?: string
          food_name?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          pickup_address?: string
          preparation_time?: string | null
          quantity?: number
          quantity_unit?: string
          servings?: number
          status?: Database["public"]["Enums"]["donation_status"]
          storage_method?: Database["public"]["Enums"]["storage_method"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_requests: {
        Row: {
          created_at: string
          donation_id: string
          id: string
          ngo_id: string
          note: string | null
          requested_quantity: number
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          donation_id: string
          id?: string
          ngo_id: string
          note?: string | null
          requested_quantity: number
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          donation_id?: string
          id?: string
          ngo_id?: string
          note?: string | null
          requested_quantity?: number
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_requests_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          distance_km: number | null
          donation_id: string
          id: string
          match_score: number
          ngo_id: string
          status: Database["public"]["Enums"]["match_status"]
          urgency_score: number
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          donation_id: string
          id?: string
          match_score?: number
          ngo_id: string
          status?: Database["public"]["Enums"]["match_status"]
          urgency_score?: number
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          donation_id?: string
          id?: string
          match_score?: number
          ngo_id?: string
          status?: Database["public"]["Enums"]["match_status"]
          urgency_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_profiles: {
        Row: {
          address: string
          capacity: number | null
          contact_person: string | null
          created_at: string
          description: string | null
          id: string
          organization_name: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address: string
          capacity?: number | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_name: string
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string
          capacity?: number | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_name?: string
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ngo_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_status: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_status?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_status?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickups: {
        Row: {
          accepted_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_location: string
          donation_id: string
          id: string
          ngo_id: string
          picked_up_at: string | null
          pickup_location: string
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
          volunteer_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_location: string
          donation_id: string
          id?: string
          ngo_id: string
          picked_up_at?: string | null
          pickup_location: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          volunteer_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_location?: string
          donation_id?: string
          id?: string
          ngo_id?: string
          picked_up_at?: string | null
          pickup_location?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickups_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_address: string | null
          organization_contact_person: string | null
          organization_name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          organization_address?: string | null
          organization_contact_person?: string | null
          organization_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_address?: string | null
          organization_contact_person?: string | null
          organization_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          donation_id: string | null
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_profiles: {
        Row: {
          address: string | null
          availability_status: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string | null
          availability_status?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string | null
          availability_status?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_impact_statistics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "donor" | "ngo" | "volunteer" | "admin"
      donation_status:
        | "available"
        | "requested"
        | "accepted"
        | "in_transit"
        | "delivered"
        | "expired"
        | "cancelled"
      food_category:
        | "cooked"
        | "raw"
        | "packaged"
        | "bakery"
        | "dairy"
        | "produce"
        | "other"
      match_status: "suggested" | "notified" | "accepted" | "expired"
      notification_type:
        | "donation"
        | "request"
        | "pickup"
        | "verification"
        | "system"
      pickup_status:
        | "open"
        | "assigned"
        | "picked_up"
        | "delivered"
        | "cancelled"
      request_status: "pending" | "approved" | "declined" | "cancelled"
      storage_method: "ambient" | "refrigerated" | "frozen" | "hot_hold"
      user_status: "active" | "suspended"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["donor", "ngo", "volunteer", "admin"],
      donation_status: [
        "available",
        "requested",
        "accepted",
        "in_transit",
        "delivered",
        "expired",
        "cancelled",
      ],
      food_category: [
        "cooked",
        "raw",
        "packaged",
        "bakery",
        "dairy",
        "produce",
        "other",
      ],
      match_status: ["suggested", "notified", "accepted", "expired"],
      notification_type: [
        "donation",
        "request",
        "pickup",
        "verification",
        "system",
      ],
      pickup_status: [
        "open",
        "assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      request_status: ["pending", "approved", "declined", "cancelled"],
      storage_method: ["ambient", "refrigerated", "frozen", "hot_hold"],
      user_status: ["active", "suspended"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
