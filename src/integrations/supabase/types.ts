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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          note: string
          reason: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          note?: string
          reason: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          note?: string
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          duration_months: number
          expires_at: string
          id: string
          method: string
          paid_at: string
          receipt_image: string | null
          receipt_number: number
          status: string
          swimmer_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          duration_months: number
          expires_at: string
          id?: string
          method: string
          paid_at: string
          receipt_image?: string | null
          receipt_number?: number
          status: string
          swimmer_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration_months?: number
          expires_at?: string
          id?: string
          method?: string
          paid_at?: string
          receipt_image?: string | null
          receipt_number?: number
          status?: string
          swimmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      swimmer_public_cards: {
        Row: {
          created_at: string
          edit_token_hash: string
          expires_at: string | null
          id: string
          name_ar: string
          name_fr: string
          photo: string | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edit_token_hash: string
          expires_at?: string | null
          id: string
          name_ar: string
          name_fr?: string
          photo?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edit_token_hash?: string
          expires_at?: string | null
          id?: string
          name_ar?: string
          name_fr?: string
          photo?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      swimmers: {
        Row: {
          birth_date: string
          birth_place: string
          blood_type: string
          created_at: string
          father_name: string
          father_phone: string
          gender: string
          id: string
          legacy_qr_id: string | null
          name_ar: string
          name_fr: string
          photo: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          birth_place?: string
          blood_type?: string
          created_at?: string
          father_name?: string
          father_phone?: string
          gender: string
          id?: string
          legacy_qr_id?: string | null
          name_ar: string
          name_fr?: string
          photo?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          birth_place?: string
          blood_type?: string
          created_at?: string
          father_name?: string
          father_phone?: string
          gender?: string
          id?: string
          legacy_qr_id?: string | null
          name_ar?: string
          name_fr?: string
          photo?: string | null
          updated_at?: string
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
    Enums: {},
  },
} as const
