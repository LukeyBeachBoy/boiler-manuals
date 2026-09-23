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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      directory_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_variants: {
        Row: {
          manual_id: string
          variant_id: string
        }
        Insert: {
          manual_id: string
          variant_id: string
        }
        Update: {
          manual_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_variants_manual_id_fkey"
            columns: ["manual_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["manual_id"]
          },
          {
            foreignKeyName: "manual_variants_manual_id_fkey"
            columns: ["manual_id"]
            isOneToOne: false
            referencedRelation: "manuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "manual_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      manuals: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          model_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          model_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          model_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "manuals_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "manuals_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manuals_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["model_id"]
          },
        ]
      }
      manufacturer_categories: {
        Row: {
          category_id: string
          manufacturer_id: string
        }
        Insert: {
          category_id: string
          manufacturer_id: string
        }
        Update: {
          category_id?: string
          manufacturer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_categories_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "manufacturer_categories_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_categories_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["manufacturer_id"]
          },
        ]
      }
      manufacturer_contacts: {
        Row: {
          action_role: string | null
          created_at: string
          display_order: number
          id: string
          kind: string
          label: string
          manufacturer_id: string
          platform: string | null
          value: string
        }
        Insert: {
          action_role?: string | null
          created_at?: string
          display_order?: number
          id?: string
          kind: string
          label: string
          manufacturer_id: string
          platform?: string | null
          value: string
        }
        Update: {
          action_role?: string | null
          created_at?: string
          display_order?: number
          id?: string
          kind?: string
          label?: string
          manufacturer_id?: string
          platform?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_contacts_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "manufacturer_contacts_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_contacts_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["manufacturer_id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          approved_installer_scheme: string | null
          created_at: string
          description: string | null
          id: string
          logo_path: string | null
          name: string
          notes: string | null
          published: boolean
          search_keywords: string[]
          technical_support_hours: string | null
          training_available: string | null
          uk_headquarters: string | null
          updated_at: string
          warranty_information: string | null
        }
        Insert: {
          approved_installer_scheme?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          notes?: string | null
          published?: boolean
          search_keywords?: string[]
          technical_support_hours?: string | null
          training_available?: string | null
          uk_headquarters?: string | null
          updated_at?: string
          warranty_information?: string | null
        }
        Update: {
          approved_installer_scheme?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          notes?: string | null
          published?: boolean
          search_keywords?: string[]
          technical_support_hours?: string | null
          training_available?: string | null
          uk_headquarters?: string | null
          updated_at?: string
          warranty_information?: string | null
        }
        Relationships: []
      }
      models: {
        Row: {
          boiler_types: Database["public"]["Enums"]["boiler_type"][]
          created_at: string
          fuel_types: Database["public"]["Enums"]["fuel_type"][]
          id: string
          manufacturer_id: string
          name: string
        }
        Insert: {
          boiler_types?: Database["public"]["Enums"]["boiler_type"][]
          created_at?: string
          fuel_types?: Database["public"]["Enums"]["fuel_type"][]
          id?: string
          manufacturer_id: string
          name: string
        }
        Update: {
          boiler_types?: Database["public"]["Enums"]["boiler_type"][]
          created_at?: string
          fuel_types?: Database["public"]["Enums"]["fuel_type"][]
          id?: string
          manufacturer_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "models_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["manufacturer_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      variants: {
        Row: {
          boiler_type: Database["public"]["Enums"]["boiler_type"] | null
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          gc_number: string
          id: string
          model_id: string
          name: string
        }
        Insert: {
          boiler_type?: Database["public"]["Enums"]["boiler_type"] | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          gc_number: string
          id?: string
          model_id: string
          name: string
        }
        Update: {
          boiler_type?: Database["public"]["Enums"]["boiler_type"] | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          gc_number?: string
          id?: string
          model_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "manual_details"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "variant_details"
            referencedColumns: ["model_id"]
          },
        ]
      }
    }
    Views: {
      manual_details: {
        Row: {
          created_at: string | null
          file_path: string | null
          file_size: number | null
          manual_id: string | null
          manufacturer_id: string | null
          manufacturer_name: string | null
          model_id: string | null
          model_name: string | null
          title: string | null
          variants: Json | null
        }
        Relationships: []
      }
      variant_details: {
        Row: {
          created_at: string | null
          gc_number: string | null
          manufacturer_id: string | null
          manufacturer_name: string | null
          model_id: string | null
          model_name: string | null
          variant_id: string | null
          variant_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_directory_admin: { Args: never; Returns: boolean }
      recompute_model_types: {
        Args: { p_model_id: string }
        Returns: undefined
      }
    }
    Enums: {
      boiler_type: "combi" | "heat_only" | "system"
      fuel_type: "natural_gas" | "lpg" | "oil"
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
      boiler_type: ["combi", "heat_only", "system"],
      fuel_type: ["natural_gas", "lpg", "oil"],
    },
  },
} as const
