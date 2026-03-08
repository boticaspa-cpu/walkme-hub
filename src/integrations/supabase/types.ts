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
      cash_movements: {
        Row: {
          amount_fx: number | null
          amount_mxn: number
          created_at: string
          created_by: string
          currency_fx: string | null
          id: string
          reference: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount_fx?: number | null
          amount_mxn?: number
          created_at?: string
          created_by: string
          currency_fx?: string | null
          id?: string
          reference?: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount_fx?: number | null
          amount_mxn?: number
          created_at?: string
          created_by?: string
          currency_fx?: string | null
          id?: string
          reference?: string | null
          session_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          business_date: string
          closed_at: string | null
          closed_by: string | null
          counted_cash_mxn: number | null
          created_at: string
          expected_cash_mxn: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_float_mxn: number
          opening_fx: Json | null
          register_id: string
          status: Database["public"]["Enums"]["cash_session_status"]
          variance_mxn: number | null
        }
        Insert: {
          business_date?: string
          closed_at?: string | null
          closed_by?: string | null
          counted_cash_mxn?: number | null
          created_at?: string
          expected_cash_mxn?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_float_mxn?: number
          opening_fx?: Json | null
          register_id: string
          status?: Database["public"]["Enums"]["cash_session_status"]
          variance_mxn?: number | null
        }
        Update: {
          business_date?: string
          closed_at?: string | null
          closed_by?: string | null
          counted_cash_mxn?: number | null
          created_at?: string
          expected_cash_mxn?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_float_mxn?: number
          opening_fx?: Json | null
          register_id?: string
          status?: Database["public"]["Enums"]["cash_session_status"]
          variance_mxn?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_register_id_fkey"
            columns: ["register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      expense_concepts: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          default_due_date: string | null
          default_due_day: number | null
          estimated_amount_mxn: number
          expense_type: Database["public"]["Enums"]["expense_type"]
          frequency: Database["public"]["Enums"]["expense_frequency"]
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_due_date?: string | null
          default_due_day?: number | null
          estimated_amount_mxn?: number
          expense_type?: Database["public"]["Enums"]["expense_type"]
          frequency?: Database["public"]["Enums"]["expense_frequency"]
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_due_date?: string | null
          default_due_day?: number | null
          estimated_amount_mxn?: number
          expense_type?: Database["public"]["Enums"]["expense_type"]
          frequency?: Database["public"]["Enums"]["expense_frequency"]
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      expense_items: {
        Row: {
          concept_id: string
          created_at: string
          created_by: string | null
          due_date: string
          estimated_amount_mxn: number
          id: string
          notes: string | null
          paid_amount_mxn: number | null
          paid_at: string | null
          payment_method:
            | Database["public"]["Enums"]["expense_payment_method"]
            | null
          period_month: string
          proof_image_path: string | null
          proof_image_url: string | null
          reference: string | null
          status: Database["public"]["Enums"]["expense_status"]
        }
        Insert: {
          concept_id: string
          created_at?: string
          created_by?: string | null
          due_date: string
          estimated_amount_mxn?: number
          id?: string
          notes?: string | null
          paid_amount_mxn?: number | null
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["expense_payment_method"]
            | null
          period_month: string
          proof_image_path?: string | null
          proof_image_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
        }
        Update: {
          concept_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          estimated_amount_mxn?: number
          id?: string
          notes?: string | null
          paid_amount_mxn?: number | null
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["expense_payment_method"]
            | null
          period_month?: string
          proof_image_path?: string | null
          proof_image_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "expense_concepts"
            referencedColumns: ["id"]
          },
        ]
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
      operator_payables: {
        Row: {
          amount_fx: number | null
          amount_mxn: number
          created_at: string
          currency_fx: string | null
          due_date: string
          id: string
          notes: string | null
          operator_id: string
          paid_at: string | null
          payable_month: string | null
          payment_rule_snapshot: string
          reservation_id: string
          service_date: string
          status: string
        }
        Insert: {
          amount_fx?: number | null
          amount_mxn?: number
          created_at?: string
          currency_fx?: string | null
          due_date: string
          id?: string
          notes?: string | null
          operator_id: string
          paid_at?: string | null
          payable_month?: string | null
          payment_rule_snapshot?: string
          reservation_id: string
          service_date: string
          status?: string
        }
        Update: {
          amount_fx?: number | null
          amount_mxn?: number
          created_at?: string
          currency_fx?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          operator_id?: string
          paid_at?: string | null
          payable_month?: string | null
          payment_rule_snapshot?: string
          reservation_id?: string
          service_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_payables_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_payables_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          active: boolean
          base_currency: string
          contact_name: string
          created_at: string
          email: string | null
          exchange_rate: number
          fee_collection_mode: string
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
          fee_collection_mode?: string
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
          fee_collection_mode?: string
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
          commission_rate: number
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          commission_rate?: number
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          commission_rate?: number
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_package_tours: {
        Row: {
          id: string
          promo_package_id: string
          tour_id: string
        }
        Insert: {
          id?: string
          promo_package_id: string
          tour_id: string
        }
        Update: {
          id?: string
          promo_package_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_package_tours_promo_package_id_fkey"
            columns: ["promo_package_id"]
            isOneToOne: false
            referencedRelation: "promo_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_package_tours_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_packages: {
        Row: {
          active: boolean
          commission_rate: number
          created_at: string
          description: string | null
          discount_rule: string
          id: string
          name: string
          preferential_adult_usd: number
          preferential_child_usd: number
          public_price_adult_usd: number
          public_price_child_usd: number
        }
        Insert: {
          active?: boolean
          commission_rate?: number
          created_at?: string
          description?: string | null
          discount_rule?: string
          id?: string
          name: string
          preferential_adult_usd?: number
          preferential_child_usd?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
        }
        Update: {
          active?: boolean
          commission_rate?: number
          created_at?: string
          description?: string | null
          discount_rule?: string
          id?: string
          name?: string
          preferential_adult_usd?: number
          preferential_child_usd?: number
          public_price_adult_usd?: number
          public_price_child_usd?: number
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          nationality: string
          package_name: string | null
          qty: number
          qty_adults: number
          qty_children: number
          quote_id: string
          tour_date: string | null
          tour_id: string | null
          unit_price_child_mxn: number
          unit_price_mxn: number
          zone: string
        }
        Insert: {
          created_at?: string
          id?: string
          nationality?: string
          package_name?: string | null
          qty?: number
          qty_adults?: number
          qty_children?: number
          quote_id: string
          tour_date?: string | null
          tour_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
          zone?: string
        }
        Update: {
          created_at?: string
          id?: string
          nationality?: string
          package_name?: string | null
          qty?: number
          qty_adults?: number
          qty_children?: number
          quote_id?: string
          tour_date?: string | null
          tour_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
          zone?: string
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
          discount_mxn: number
          folio: string | null
          id: string
          notes: string | null
          reservation_id: string | null
          status: string
          total_mxn: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          discount_mxn?: number
          folio?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
          status?: string
          total_mxn?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          discount_mxn?: number
          folio?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
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
          {
            foreignKeyName: "quotes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_items: {
        Row: {
          created_at: string | null
          id: string
          nationality: string | null
          package_name: string | null
          qty_adults: number
          qty_children: number
          reservation_id: string
          subtotal_mxn: number
          tour_date: string | null
          tour_id: string | null
          unit_price_child_mxn: number
          unit_price_mxn: number
          zone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nationality?: string | null
          package_name?: string | null
          qty_adults?: number
          qty_children?: number
          reservation_id: string
          subtotal_mxn?: number
          tour_date?: string | null
          tour_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
          zone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nationality?: string | null
          package_name?: string | null
          qty_adults?: number
          qty_children?: number
          reservation_id?: string
          subtotal_mxn?: number
          tour_date?: string | null
          tour_id?: string | null
          unit_price_child_mxn?: number
          unit_price_mxn?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_folio: string | null
          client_id: string | null
          confirmation_status: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          discount_mxn: number
          folio: string | null
          id: string
          modality: string
          nationality: string
          notes: string | null
          operator_folio: string | null
          pax: number
          pax_adults: number
          pax_children: number
          payment_status: string
          reservation_date: string
          reservation_time: string
          sale_id: string | null
          status: string
          total_mxn: number
          tour_id: string | null
          updated_at: string
          zone: string
        }
        Insert: {
          cancellation_folio?: string | null
          client_id?: string | null
          confirmation_status?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_mxn?: number
          folio?: string | null
          id?: string
          modality?: string
          nationality?: string
          notes?: string | null
          operator_folio?: string | null
          pax?: number
          pax_adults?: number
          pax_children?: number
          payment_status?: string
          reservation_date: string
          reservation_time?: string
          sale_id?: string | null
          status?: string
          total_mxn?: number
          tour_id?: string | null
          updated_at?: string
          zone?: string
        }
        Update: {
          cancellation_folio?: string | null
          client_id?: string | null
          confirmation_status?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_mxn?: number
          folio?: string | null
          id?: string
          modality?: string
          nationality?: string
          notes?: string | null
          operator_folio?: string | null
          pax?: number
          pax_adults?: number
          pax_children?: number
          payment_status?: string
          reservation_date?: string
          reservation_time?: string
          sale_id?: string | null
          status?: string
          total_mxn?: number
          tour_id?: string | null
          updated_at?: string
          zone?: string
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
            foreignKeyName: "reservations_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
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
          tour_date: string | null
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
          tour_date?: string | null
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
          tour_date?: string | null
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
          cash_session_id: string | null
          client_id: string | null
          currency: string
          discount_mxn: number
          exchange_rate: number
          id: string
          payment_method: string
          receipt_number: string | null
          reservation_id: string | null
          sold_at: string
          sold_by: string | null
          subtotal_mxn: number
          total_mxn: number
        }
        Insert: {
          cash_session_id?: string | null
          client_id?: string | null
          currency?: string
          discount_mxn?: number
          exchange_rate?: number
          id?: string
          payment_method?: string
          receipt_number?: string | null
          reservation_id?: string | null
          sold_at?: string
          sold_by?: string | null
          subtotal_mxn?: number
          total_mxn?: number
        }
        Update: {
          cash_session_id?: string | null
          client_id?: string | null
          currency?: string
          discount_mxn?: number
          exchange_rate?: number
          id?: string
          payment_method?: string
          receipt_number?: string | null
          reservation_id?: string | null
          sold_at?: string
          sold_by?: string | null
          subtotal_mxn?: number
          total_mxn?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
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
          package_name: string | null
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
          package_name?: string | null
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
          package_name?: string | null
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
          service_type: string
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
          service_type?: string
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
          service_type?: string
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
      cash_movement_type:
        | "sale_cash"
        | "sale_card"
        | "sale_transfer"
        | "in_cash"
        | "out_cash"
        | "refund"
        | "withdrawal"
        | "adjustment"
      cash_session_status: "open" | "closed"
      expense_frequency: "monthly" | "one_time"
      expense_payment_method: "cash" | "bank_transfer" | "card" | "other"
      expense_status: "planned" | "paid"
      expense_type: "fixed" | "variable"
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
      cash_movement_type: [
        "sale_cash",
        "sale_card",
        "sale_transfer",
        "in_cash",
        "out_cash",
        "refund",
        "withdrawal",
        "adjustment",
      ],
      cash_session_status: ["open", "closed"],
      expense_frequency: ["monthly", "one_time"],
      expense_payment_method: ["cash", "bank_transfer", "card", "other"],
      expense_status: ["planned", "paid"],
      expense_type: ["fixed", "variable"],
    },
  },
} as const
