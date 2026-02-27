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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount_mxn: number
          created_at: string
          id: string
          rate: number
          sale_id: string | null
          seller_id: string
        }
        Insert: {
          amount_mxn?: number
          created_at?: string
          id?: string
          rate?: number
          sale_id?: string | null
          seller_id: string
        }
        Update: {
          amount_mxn?: number
          created_at?: string
          id?: string
          rate?: number
          sale_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_closings: {
        Row: {
          card_mxn: number
          cash_cad: number
          cash_eur: number
          cash_mxn: number
          cash_usd: number
          closed_by: string | null
          closing_date: string
          created_at: string
          exchange_rate_cad: number
          exchange_rate_eur: number
          exchange_rate_usd: number
          grand_total_mxn: number
          id: string
          total_sales: number
          transfer_mxn: number
        }
        Insert: {
          card_mxn?: number
          cash_cad?: number
          cash_eur?: number
          cash_mxn?: number
          cash_usd?: number
          closed_by?: string | null
          closing_date: string
          created_at?: string
          exchange_rate_cad?: number
          exchange_rate_eur?: number
          exchange_rate_usd?: number
          grand_total_mxn?: number
          id?: string
          total_sales?: number
          transfer_mxn?: number
        }
        Update: {
          card_mxn?: number
          cash_cad?: number
          cash_eur?: number
          cash_mxn?: number
          cash_usd?: number
          closed_by?: string | null
          closing_date?: string
          created_at?: string
          exchange_rate_cad?: number
          exchange_rate_eur?: number
          exchange_rate_usd?: number
          grand_total_mxn?: number
          id?: string
          total_sales?: number
          transfer_mxn?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_closings_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: string | null
          client_id: string | null
          created_at: string
          destination: string
          id: string
          name: string
          notes: string | null
          origin: string
          pax: number
          phone: string
          status: string
          travel_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          client_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          name: string
          notes?: string | null
          origin?: string
          pax?: number
          phone?: string
          status?: string
          travel_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          client_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          name?: string
          notes?: string | null
          origin?: string
          pax?: number
          phone?: string
          status?: string
          travel_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          active: boolean
          base_currency: string
          contact_name: string
          created_at: string
          email: string | null
          exchange_rate: number
          id: string
          logo_url: string | null
          name: string
          payment_rules: string
          phone: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_currency?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          exchange_rate?: number
          id?: string
          logo_url?: string | null
          name: string
          payment_rules?: string
          phone?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_currency?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          exchange_rate?: number
          id?: string
          logo_url?: string | null
          name?: string
          payment_rules?: string
          phone?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          qty: number
          quote_id: string
          tour_id: string | null
          unit_price_mxn: number
        }
        Insert: {
          created_at?: string
          id?: string
          qty?: number
          quote_id: string
          tour_id?: string | null
          unit_price_mxn?: number
        }
        Update: {
          created_at?: string
          id?: string
          qty?: number
          quote_id?: string
          tour_id?: string | null
          unit_price_mxn?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string | null
          folio: string | null
          id: string
          notes: string | null
          status: string
          total_mxn: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_mxn?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_mxn?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          folio: string | null
          id: string
          modality: string
          notes: string | null
          pax: number
          reservation_date: string
          reservation_time: string
          status: string
          total_mxn: number
          tour_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          folio?: string | null
          id?: string
          modality?: string
          notes?: string | null
          pax?: number
          reservation_date: string
          reservation_time?: string
          status?: string
          total_mxn?: number
          tour_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          folio?: string | null
          id?: string
          modality?: string
          notes?: string | null
          pax?: number
          reservation_date?: string
          reservation_time?: string
          status?: string
          total_mxn?: number
          tour_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          qty: number
          qty_adults: number
          qty_children: number
          sale_id: string
          tour_id: string | null
          tour_package_id: string | null
          tour_price_variant_id: string | null
          unit_price_child_mxn: number
          unit_price_mxn: number
        }
        Insert: {
          id?: string
          qty?: number
          qty_adults?: number
          qty_children?: number
          sale_id: string
          tour_id?: string | null
          tour_package_id?: string | null
          tour_price_variant_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
        }
        Update: {
          id?: string
          qty?: number
          qty_adults?: number
          qty_children?: number
          sale_id?: string
          tour_id?: string | null
          tour_package_id?: string | null
          tour_price_variant_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_tour_package_id_fkey"
            columns: ["tour_package_id"]
            isOneToOne: false
            referencedRelation: "tour_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_tour_price_variant_id_fkey"
            columns: ["tour_price_variant_id"]
            isOneToOne: false
            referencedRelation: "tour_price_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_tour_price_variant_id_fkey"
            columns: ["tour_price_variant_id"]
            isOneToOne: false
            referencedRelation: "tour_price_variants_seller"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          currency: string
          discount_mxn: number
          exchange_rate: number
          id: string
          payment_method: string
          reservation_id: string | null
          sold_at: string
          sold_by: string | null
          subtotal_mxn: number
          total_mxn: number
        }
        Insert: {
          client_id?: string | null
          currency?: string
          discount_mxn?: number
          exchange_rate?: number
          id?: string
          payment_method?: string
          reservation_id?: string | null
          sold_at?: string
          sold_by?: string | null
          subtotal_mxn?: number
          total_mxn?: number
        }
        Update: {
          client_id?: string | null
          currency?: string
          discount_mxn?: number
          exchange_rate?: number
          id?: string
          payment_method?: string
          reservation_id?: string | null
          sold_at?: string
          sold_by?: string | null
          subtotal_mxn?: number
          total_mxn?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      tour_packages: {
        Row: {
          active: boolean
          cost_adult_usd: number
          cost_child_usd: number
          created_at: string
          exchange_rate_tour: number
          excludes: string[]
          id: string
          includes: string[]
          mandatory_fees_usd: number
          name: string
          price_adult_mxn: number
          price_child_mxn: number
          public_price_adult_usd: number
          public_price_child_usd: number
          service_type: string
          sort_order: number
          tax_adult_usd: number
          tax_child_usd: number
          tour_id: string
        }
        Insert: {
          active?: boolean
          cost_adult_usd?: number
          cost_child_usd?: number
          created_at?: string
          exchange_rate_tour?: number
          excludes?: string[]
          id?: string
          includes?: string[]
          mandatory_fees_usd?: number
          name: string
          price_adult_mxn?: number
          price_child_mxn?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
          service_type?: string
          sort_order?: number
          tax_adult_usd?: number
          tax_child_usd?: number
          tour_id: string
        }
        Update: {
          active?: boolean
          cost_adult_usd?: number
          cost_child_usd?: number
          created_at?: string
          exchange_rate_tour?: number
          excludes?: string[]
          id?: string
          includes?: string[]
          mandatory_fees_usd?: number
          name?: string
          price_adult_mxn?: number
          price_child_mxn?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
          service_type?: string
          sort_order?: number
          tax_adult_usd?: number
          tax_child_usd?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_packages_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_price_variants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          nationality: string
          net_cost: number
          operator_id: string
          pax_type: string
          sale_price: number
          tax_fee: number
          tour_id: string
          zone: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          nationality?: string
          net_cost?: number
          operator_id: string
          pax_type?: string
          sale_price?: number
          tax_fee?: number
          tour_id: string
          zone?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          nationality?: string
          net_cost?: number
          operator_id?: string
          pax_type?: string
          sale_price?: number
          tax_fee?: number
          tour_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_price_variants_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_price_variants_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          active: boolean
          calculation_mode: string
          category_id: string | null
          child_age_max: number
          child_age_min: number
          commission_percentage: number
          created_at: string
          days: string[]
          destination_id: string | null
          exchange_rate_tour: number
          excludes: string[]
          id: string
          image_urls: string[]
          includes: string[]
          itinerary: string
          mandatory_fees_usd: number
          meeting_point: string
          operator_id: string | null
          price_adult_usd: number
          price_child_usd: number
          price_mxn: number
          public_price_adult_usd: number
          public_price_child_usd: number
          recommendations: string | null
          short_description: string
          suggested_price_mxn: number
          tags: string[]
          tax_adult_usd: number
          tax_child_usd: number
          title: string
          type: string
          updated_at: string
          what_to_bring: string[]
        }
        Insert: {
          active?: boolean
          calculation_mode?: string
          category_id?: string | null
          child_age_max?: number
          child_age_min?: number
          commission_percentage?: number
          created_at?: string
          days?: string[]
          destination_id?: string | null
          exchange_rate_tour?: number
          excludes?: string[]
          id?: string
          image_urls?: string[]
          includes?: string[]
          itinerary?: string
          mandatory_fees_usd?: number
          meeting_point?: string
          operator_id?: string | null
          price_adult_usd?: number
          price_child_usd?: number
          price_mxn?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
          recommendations?: string | null
          short_description?: string
          suggested_price_mxn?: number
          tags?: string[]
          tax_adult_usd?: number
          tax_child_usd?: number
          title: string
          type?: string
          updated_at?: string
          what_to_bring?: string[]
        }
        Update: {
          active?: boolean
          calculation_mode?: string
          category_id?: string | null
          child_age_max?: number
          child_age_min?: number
          commission_percentage?: number
          created_at?: string
          days?: string[]
          destination_id?: string | null
          exchange_rate_tour?: number
          excludes?: string[]
          id?: string
          image_urls?: string[]
          includes?: string[]
          itinerary?: string
          mandatory_fees_usd?: number
          meeting_point?: string
          operator_id?: string | null
          price_adult_usd?: number
          price_child_usd?: number
          price_mxn?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
          recommendations?: string | null
          short_description?: string
          suggested_price_mxn?: number
          tags?: string[]
          tax_adult_usd?: number
          tax_child_usd?: number
          title?: string
          type?: string
          updated_at?: string
          what_to_bring?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "tours_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
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
    }
    Views: {
      tour_price_variants_seller: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string | null
          nationality: string | null
          operator_id: string | null
          pax_type: string | null
          sale_price: number | null
          tax_fee: number | null
          tour_id: string | null
          zone: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          nationality?: string | null
          operator_id?: string | null
          pax_type?: string | null
          sale_price?: number | null
          tax_fee?: number | null
          tour_id?: string | null
          zone?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          nationality?: string | null
          operator_id?: string | null
          pax_type?: string | null
          sale_price?: number | null
          tax_fee?: number | null
          tour_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_price_variants_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_price_variants_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "seller"
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
      app_role: ["admin", "seller"],
    },
  },
} as const
