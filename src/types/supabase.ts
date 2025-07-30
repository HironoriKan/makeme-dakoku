export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      daily_reports: {
        Row: {
          checkout_time: string | null
          created_at: string | null
          customer_count: number
          customer_unit_price: number
          id: string
          items_per_customer: number
          items_sold: number
          notes: string | null
          report_date: string
          sales_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checkout_time?: string | null
          created_at?: string | null
          customer_count: number
          customer_unit_price?: number
          id?: string
          items_per_customer?: number
          items_sold: number
          notes?: string | null
          report_date: string
          sales_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checkout_time?: string | null
          created_at?: string | null
          customer_count?: number
          customer_unit_price?: number
          id?: string
          items_per_customer?: number
          items_sold?: number
          notes?: string | null
          report_date?: string
          sales_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_record_changes: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"]
          created_at: string
          id: string
          new_location_name: string | null
          new_note: string | null
          new_record_type: Database["public"]["Enums"]["record_type"] | null
          new_recorded_at: string | null
          original_location_name: string | null
          original_note: string | null
          original_record_type: Database["public"]["Enums"]["record_type"] | null
          original_recorded_at: string | null
          reason: string
          time_record_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          change_type: Database["public"]["Enums"]["change_type"]
          created_at?: string
          id?: string
          new_location_name?: string | null
          new_note?: string | null
          new_record_type?: Database["public"]["Enums"]["record_type"] | null
          new_recorded_at?: string | null
          original_location_name?: string | null
          original_note?: string | null
          original_record_type?: Database["public"]["Enums"]["record_type"] | null
          original_recorded_at?: string | null
          reason: string
          time_record_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"]
          created_at?: string
          id?: string
          new_location_name?: string | null
          new_note?: string | null
          new_record_type?: Database["public"]["Enums"]["record_type"] | null
          new_recorded_at?: string | null
          original_location_name?: string | null
          original_note?: string | null
          original_record_type?: Database["public"]["Enums"]["record_type"] | null
          original_recorded_at?: string | null
          reason?: string
          time_record_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_record_changes_time_record_id_fkey"
            columns: ["time_record_id"]
            isOneToOne: false
            referencedRelation: "time_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_record_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          note: string | null
          shift_date: string
          shift_status: Database["public"]["Enums"]["shift_status"]
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          note?: string | null
          shift_date: string
          shift_status?: Database["public"]["Enums"]["shift_status"]
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          note?: string | null
          shift_date?: string
          shift_status?: Database["public"]["Enums"]["shift_status"]
          shift_type?: Database["public"]["Enums"]["shift_type"]
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          note: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          recorded_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          note?: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          recorded_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          note?: string | null
          record_type?: Database["public"]["Enums"]["record_type"]
          recorded_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          line_user_id: string
          picture_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          line_user_id: string
          picture_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          line_user_id?: string
          picture_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_config: {
        Args: { setting_name: string; new_value: string; is_local?: boolean }
        Returns: string
      }
    }
    Enums: {
      change_type: "edit" | "delete"
      record_type: "clock_in" | "clock_out" | "break_start" | "break_end"
      shift_status: "adjusting" | "confirmed"
      shift_type: "early" | "late" | "normal" | "off"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      change_type: ["edit", "delete"],
      record_type: ["clock_in", "clock_out", "break_start", "break_end"],
      shift_status: ["adjusting", "confirmed"],
      shift_type: ["early", "late", "normal", "off"],
    },
  },
} as const