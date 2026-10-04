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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          created_by: string | null
          deleted_at: string | null
          device_id: string | null
          end_time: string | null
          farm_id: string
          id: string
          iso_week: number | null
          iso_year: number | null
          method: Database["public"]["Enums"]["application_method"] | null
          notes: string | null
          operation_type_id: string | null
          performed_by_name: string | null
          performed_on: string
          reason: string | null
          recommendation_id: string | null
          server_updated_at: string
          start_time: string | null
          target_pest_id: string | null
          updated_at: string
          updated_by: string | null
          water_volume_l: number | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          end_time?: string | null
          farm_id: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          method?: Database["public"]["Enums"]["application_method"] | null
          notes?: string | null
          operation_type_id?: string | null
          performed_by_name?: string | null
          performed_on: string
          reason?: string | null
          recommendation_id?: string | null
          server_updated_at?: string
          start_time?: string | null
          target_pest_id?: string | null
          updated_at?: string
          updated_by?: string | null
          water_volume_l?: number | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          end_time?: string | null
          farm_id?: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          method?: Database["public"]["Enums"]["application_method"] | null
          notes?: string | null
          operation_type_id?: string | null
          performed_by_name?: string | null
          performed_on?: string
          reason?: string | null
          recommendation_id?: string | null
          server_updated_at?: string
          start_time?: string | null
          target_pest_id?: string | null
          updated_at?: string
          updated_by?: string | null
          water_volume_l?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_operation_type_id_fkey"
            columns: ["operation_type_id"]
            isOneToOne: false
            referencedRelation: "operation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_recommendation_id_farm_id_fkey"
            columns: ["recommendation_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "activities_target_pest_id_fkey"
            columns: ["target_pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_greenhouses: {
        Row: {
          activity_id: string
          created_at: string
          created_by: string | null
          crop_cycle_id: string | null
          deleted_at: string | null
          farm_id: string
          greenhouse_id: string
          id: string
          rows_scope: string | null
          server_updated_at: string
          treated_area_m2: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          farm_id: string
          greenhouse_id: string
          id?: string
          rows_scope?: string | null
          server_updated_at?: string
          treated_area_m2?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          farm_id?: string
          greenhouse_id?: string
          id?: string
          rows_scope?: string | null
          server_updated_at?: string
          treated_area_m2?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_greenhouses_activity_id_farm_id_fkey"
            columns: ["activity_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "activity_greenhouses_activity_id_farm_id_fkey"
            columns: ["activity_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "v_activity_log"
            referencedColumns: ["activity_id", "farm_id"]
          },
          {
            foreignKeyName: "activity_greenhouses_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "activity_greenhouses_greenhouse_id_farm_id_fkey"
            columns: ["greenhouse_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "greenhouses"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      activity_products: {
        Row: {
          activity_id: string
          batch_no: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dose: number | null
          dose_unit: Database["public"]["Enums"]["dose_unit"] | null
          farm_id: string
          id: string
          notes: string | null
          product_id: string
          server_updated_at: string
          total_quantity: number | null
          total_unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_id: string
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dose?: number | null
          dose_unit?: Database["public"]["Enums"]["dose_unit"] | null
          farm_id: string
          id?: string
          notes?: string | null
          product_id: string
          server_updated_at?: string
          total_quantity?: number | null
          total_unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_id?: string
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dose?: number | null
          dose_unit?: Database["public"]["Enums"]["dose_unit"] | null
          farm_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          server_updated_at?: string
          total_quantity?: number | null
          total_unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_products_activity_id_farm_id_fkey"
            columns: ["activity_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "activity_products_activity_id_farm_id_fkey"
            columns: ["activity_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "v_activity_log"
            referencedColumns: ["activity_id", "farm_id"]
          },
          {
            foreignKeyName: "activity_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          device_id: string | null
          entity_id: string
          entity_table: string
          farm_id: string
          id: string
          mime_type: string | null
          server_updated_at: string
          storage_path: string
          taken_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          entity_id: string
          entity_table: string
          farm_id: string
          id?: string
          mime_type?: string | null
          server_updated_at?: string
          storage_path: string
          taken_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          entity_id?: string
          entity_table?: string
          farm_id?: string
          id?: string
          mime_type?: string | null
          server_updated_at?: string
          storage_path?: string
          taken_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_targets: {
        Row: {
          created_at: string
          created_by: string | null
          crop_cycle_id: string
          deleted_at: string | null
          farm_id: string
          flowering_height_max_cm: number | null
          flowering_height_min_cm: number | null
          id: string
          notes: string | null
          server_updated_at: string
          stem_diameter_max_mm: number | null
          stem_diameter_min_mm: number | null
          updated_at: string
          updated_by: string | null
          valid_from: string
          valid_to: string | null
          weekly_growth_max_cm: number | null
          weekly_growth_min_cm: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id: string
          deleted_at?: string | null
          farm_id: string
          flowering_height_max_cm?: number | null
          flowering_height_min_cm?: number | null
          id?: string
          notes?: string | null
          server_updated_at?: string
          stem_diameter_max_mm?: number | null
          stem_diameter_min_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_from: string
          valid_to?: string | null
          weekly_growth_max_cm?: number | null
          weekly_growth_min_cm?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string
          deleted_at?: string | null
          farm_id?: string
          flowering_height_max_cm?: number | null
          flowering_height_min_cm?: number | null
          id?: string
          notes?: string | null
          server_updated_at?: string
          stem_diameter_max_mm?: number | null
          stem_diameter_min_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          weekly_growth_max_cm?: number | null
          weekly_growth_min_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_targets_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      crop_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          crop_id: string
          deleted_at: string | null
          end_date: string | null
          expected_end_date: string | null
          farm_id: string
          greenhouse_id: string
          id: string
          notes: string | null
          plant_density_m2: number | null
          planting_date: string
          plants_count: number | null
          rootstock: string | null
          server_updated_at: string
          status: Database["public"]["Enums"]["crop_cycle_status"]
          stem_density_m2: number | null
          substrate: Database["public"]["Enums"]["substrate_type"] | null
          updated_at: string
          updated_by: string | null
          variety_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_id: string
          deleted_at?: string | null
          end_date?: string | null
          expected_end_date?: string | null
          farm_id: string
          greenhouse_id: string
          id?: string
          notes?: string | null
          plant_density_m2?: number | null
          planting_date: string
          plants_count?: number | null
          rootstock?: string | null
          server_updated_at?: string
          status?: Database["public"]["Enums"]["crop_cycle_status"]
          stem_density_m2?: number | null
          substrate?: Database["public"]["Enums"]["substrate_type"] | null
          updated_at?: string
          updated_by?: string | null
          variety_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_id?: string
          deleted_at?: string | null
          end_date?: string | null
          expected_end_date?: string | null
          farm_id?: string
          greenhouse_id?: string
          id?: string
          notes?: string | null
          plant_density_m2?: number | null
          planting_date?: string
          plants_count?: number | null
          rootstock?: string | null
          server_updated_at?: string
          status?: Database["public"]["Enums"]["crop_cycle_status"]
          stem_density_m2?: number | null
          substrate?: Database["public"]["Enums"]["substrate_type"] | null
          updated_at?: string
          updated_by?: string | null
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_greenhouse_id_farm_id_fkey"
            columns: ["greenhouse_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "greenhouses"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "crop_cycles_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_registration_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          crop_cycle_id: string
          deleted_at: string | null
          device_id: string | null
          farm_id: string
          id: string
          iso_week: number | null
          iso_year: number | null
          measured_on: string
          notes: string | null
          scout_id: string | null
          server_updated_at: string
          started_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id: string
          deleted_at?: string | null
          device_id?: string | null
          farm_id: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          measured_on: string
          notes?: string | null
          scout_id?: string | null
          server_updated_at?: string
          started_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string
          deleted_at?: string | null
          device_id?: string | null
          farm_id?: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          measured_on?: string
          notes?: string | null
          scout_id?: string | null
          server_updated_at?: string
          started_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_registration_sessions_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      crops: {
        Row: {
          code: string
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          code: string
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          code?: string
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      farm_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          farm_id: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          farm_id: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          farm_id?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "farm_invitations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_members: {
        Row: {
          created_at: string
          farm_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          location_text: string | null
          name: string
          organization_id: string
          server_updated_at: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location_text?: string | null
          name: string
          organization_id: string
          server_updated_at?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location_text?: string | null
          name?: string
          organization_id?: string
          server_updated_at?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      greenhouses: {
        Row: {
          area_m2: number | null
          code: string
          cover_material: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          farm_id: string
          greenhouse_type: string | null
          id: string
          name: string | null
          notes: string | null
          row_length_m: number | null
          rows_count: number | null
          server_updated_at: string
          spans_count: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          area_m2?: number | null
          code: string
          cover_material?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          farm_id: string
          greenhouse_type?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          row_length_m?: number | null
          rows_count?: number | null
          server_updated_at?: string
          spans_count?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          area_m2?: number | null
          code?: string
          cover_material?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          farm_id?: string
          greenhouse_type?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          row_length_m?: number | null
          rows_count?: number | null
          server_updated_at?: string
          spans_count?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "greenhouses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_types: {
        Row: {
          category: Database["public"]["Enums"]["operation_category"]
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          farm_id: string | null
          id: string
          name_ar: string
          name_en: string
          server_updated_at: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["operation_category"]
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          name_ar: string
          name_en: string
          server_updated_at?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["operation_category"]
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          server_updated_at?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_types_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          server_updated_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pests: {
        Row: {
          category: Database["public"]["Enums"]["pest_category"]
          code: string
          created_at: string
          created_by: string | null
          default_count_unit: Database["public"]["Enums"]["count_unit"]
          deleted_at: string | null
          farm_id: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          scientific_name: string | null
          server_updated_at: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["pest_category"]
          code: string
          created_at?: string
          created_by?: string | null
          default_count_unit?: Database["public"]["Enums"]["count_unit"]
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          scientific_name?: string | null
          server_updated_at?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["pest_category"]
          code?: string
          created_at?: string
          created_by?: string | null
          default_count_unit?: Database["public"]["Enums"]["count_unit"]
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          scientific_name?: string | null
          server_updated_at?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pests_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_measurements: {
        Row: {
          created_at: string
          created_by: string | null
          crop_cycle_id: string
          deleted_at: string | null
          device_id: string | null
          extra: Json
          farm_id: string
          flowering_truss_height_cm: number | null
          flowering_truss_no: number | null
          fruit_set_pct: number | null
          fruits_on_plant: number | null
          harvest_truss_no: number | null
          id: string
          iso_week: number | null
          iso_year: number | null
          leaf_count_remaining: number | null
          leaf_count_total: number | null
          leaves_removed: number | null
          measured_on: string
          notes: string | null
          open_flowers_count: number | null
          plant_height_cm: number | null
          reference_plant_id: string
          server_updated_at: string
          session_id: string
          set_truss_flowers: number | null
          set_truss_fruits: number | null
          set_truss_no: number | null
          stem_diameter_mm: number | null
          updated_at: string
          updated_by: string | null
          weekly_growth_cm: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id: string
          deleted_at?: string | null
          device_id?: string | null
          extra?: Json
          farm_id: string
          flowering_truss_height_cm?: number | null
          flowering_truss_no?: number | null
          fruit_set_pct?: number | null
          fruits_on_plant?: number | null
          harvest_truss_no?: number | null
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          leaf_count_remaining?: number | null
          leaf_count_total?: number | null
          leaves_removed?: number | null
          measured_on: string
          notes?: string | null
          open_flowers_count?: number | null
          plant_height_cm?: number | null
          reference_plant_id: string
          server_updated_at?: string
          session_id: string
          set_truss_flowers?: number | null
          set_truss_fruits?: number | null
          set_truss_no?: number | null
          stem_diameter_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          weekly_growth_cm?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string
          deleted_at?: string | null
          device_id?: string | null
          extra?: Json
          farm_id?: string
          flowering_truss_height_cm?: number | null
          flowering_truss_no?: number | null
          fruit_set_pct?: number | null
          fruits_on_plant?: number | null
          harvest_truss_no?: number | null
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          leaf_count_remaining?: number | null
          leaf_count_total?: number | null
          leaves_removed?: number | null
          measured_on?: string
          notes?: string | null
          open_flowers_count?: number | null
          plant_height_cm?: number | null
          reference_plant_id?: string
          server_updated_at?: string
          session_id?: string
          set_truss_flowers?: number | null
          set_truss_fruits?: number | null
          set_truss_no?: number | null
          stem_diameter_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          weekly_growth_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_measurements_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "plant_measurements_reference_plant_id_crop_cycle_id_fkey"
            columns: ["reference_plant_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "reference_plants"
            referencedColumns: ["id", "crop_cycle_id"]
          },
          {
            foreignKeyName: "plant_measurements_session_id_crop_cycle_id_fkey"
            columns: ["session_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_registration_sessions"
            referencedColumns: ["id", "crop_cycle_id"]
          },
        ]
      }
      products: {
        Row: {
          active_ingredient: string | null
          bio_species: string | null
          concentration: string | null
          created_at: string
          created_by: string | null
          default_dose_unit: Database["public"]["Enums"]["dose_unit"] | null
          deleted_at: string | null
          farm_id: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          moa_code: string | null
          name: string
          notes: string | null
          phi_days: number | null
          product_type: Database["public"]["Enums"]["product_type"]
          rei_hours: number | null
          server_updated_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_ingredient?: string | null
          bio_species?: string | null
          concentration?: string | null
          created_at?: string
          created_by?: string | null
          default_dose_unit?: Database["public"]["Enums"]["dose_unit"] | null
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          moa_code?: string | null
          name: string
          notes?: string | null
          phi_days?: number | null
          product_type: Database["public"]["Enums"]["product_type"]
          rei_hours?: number | null
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_ingredient?: string | null
          bio_species?: string | null
          concentration?: string | null
          created_at?: string
          created_by?: string | null
          default_dose_unit?: Database["public"]["Enums"]["dose_unit"] | null
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          moa_code?: string | null
          name?: string
          notes?: string | null
          phi_days?: number | null
          product_type?: Database["public"]["Enums"]["product_type"]
          rei_hours?: number | null
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          created_by: string | null
          crop_cycle_id: string | null
          deleted_at: string | null
          due_on: string | null
          farm_id: string
          greenhouse_id: string | null
          id: string
          observation_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          resolved_at: string | null
          server_updated_at: string
          status: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          due_on?: string | null
          farm_id: string
          greenhouse_id?: string | null
          id?: string
          observation_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolved_at?: string | null
          server_updated_at?: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          due_on?: string | null
          farm_id?: string
          greenhouse_id?: string | null
          id?: string
          observation_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolved_at?: string | null
          server_updated_at?: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "recommendations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_greenhouse_id_farm_id_fkey"
            columns: ["greenhouse_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "greenhouses"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "recommendations_observation_id_farm_id_fkey"
            columns: ["observation_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "scouting_observations"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      reference_plants: {
        Row: {
          created_at: string
          created_by: string | null
          crop_cycle_id: string
          deleted_at: string | null
          farm_id: string
          id: string
          is_active: boolean
          label: string
          position_m: number | null
          replaced_by_id: string | null
          row_no: number
          server_updated_at: string
          span_no: number | null
          stem_no: number
          tag_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id: string
          deleted_at?: string | null
          farm_id: string
          id?: string
          is_active?: boolean
          label: string
          position_m?: number | null
          replaced_by_id?: string | null
          row_no: number
          server_updated_at?: string
          span_no?: number | null
          stem_no?: number
          tag_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string
          deleted_at?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean
          label?: string
          position_m?: number | null
          replaced_by_id?: string | null
          row_no?: number
          server_updated_at?: string
          span_no?: number | null
          stem_no?: number
          tag_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_plants_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "reference_plants_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "reference_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      scouting_observations: {
        Row: {
          count_unit: Database["public"]["Enums"]["count_unit"] | null
          count_value: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          device_id: string | null
          farm_id: string
          id: string
          is_hotspot: boolean
          life_stage: string | null
          method: Database["public"]["Enums"]["scouting_method"]
          notes: string | null
          pest_id: string
          plants_infested: number | null
          plants_inspected: number | null
          position_m: number | null
          row_no: number | null
          server_updated_at: string
          session_id: string
          severity: number
          span_no: number | null
          trap_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          count_unit?: Database["public"]["Enums"]["count_unit"] | null
          count_value?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          farm_id: string
          id?: string
          is_hotspot?: boolean
          life_stage?: string | null
          method?: Database["public"]["Enums"]["scouting_method"]
          notes?: string | null
          pest_id: string
          plants_infested?: number | null
          plants_inspected?: number | null
          position_m?: number | null
          row_no?: number | null
          server_updated_at?: string
          session_id: string
          severity: number
          span_no?: number | null
          trap_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          count_unit?: Database["public"]["Enums"]["count_unit"] | null
          count_value?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device_id?: string | null
          farm_id?: string
          id?: string
          is_hotspot?: boolean
          life_stage?: string | null
          method?: Database["public"]["Enums"]["scouting_method"]
          notes?: string | null
          pest_id?: string
          plants_infested?: number | null
          plants_inspected?: number | null
          position_m?: number | null
          row_no?: number | null
          server_updated_at?: string
          session_id?: string
          severity?: number
          span_no?: number | null
          trap_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scouting_observations_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_observations_session_id_farm_id_fkey"
            columns: ["session_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "scouting_sessions"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      scouting_sessions: {
        Row: {
          air_rh_pct: number | null
          air_temp_c: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          crop_cycle_id: string | null
          deleted_at: string | null
          device_id: string | null
          farm_id: string
          greenhouse_id: string
          id: string
          iso_week: number | null
          iso_year: number | null
          notes: string | null
          plants_inspected: number | null
          scout_id: string | null
          scouted_on: string
          server_updated_at: string
          started_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          air_rh_pct?: number | null
          air_temp_c?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          device_id?: string | null
          farm_id: string
          greenhouse_id: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          notes?: string | null
          plants_inspected?: number | null
          scout_id?: string | null
          scouted_on: string
          server_updated_at?: string
          started_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          air_rh_pct?: number | null
          air_temp_c?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_cycle_id?: string | null
          deleted_at?: string | null
          device_id?: string | null
          farm_id?: string
          greenhouse_id?: string
          id?: string
          iso_week?: number | null
          iso_year?: number | null
          notes?: string | null
          plants_inspected?: number | null
          scout_id?: string | null
          scouted_on?: string
          server_updated_at?: string
          started_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scouting_sessions_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "scouting_sessions_greenhouse_id_farm_id_fkey"
            columns: ["greenhouse_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "greenhouses"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      varieties: {
        Row: {
          created_at: string
          created_by: string | null
          crop_id: string
          deleted_at: string | null
          farm_id: string | null
          id: string
          name: string
          notes: string | null
          seed_company: string | null
          server_updated_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_id: string
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          name: string
          notes?: string | null
          seed_company?: string | null
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_id?: string
          deleted_at?: string | null
          farm_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          seed_company?: string | null
          server_updated_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "varieties_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "varieties_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_activity_log: {
        Row: {
          active_ingredient: string | null
          activity_id: string | null
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          bio_species: string | null
          crop_cycle_id: string | null
          dose: number | null
          dose_unit: Database["public"]["Enums"]["dose_unit"] | null
          farm_id: string | null
          greenhouse_id: string | null
          harvest_allowed_from: string | null
          iso_week: number | null
          iso_year: number | null
          method: Database["public"]["Enums"]["application_method"] | null
          moa_code: string | null
          notes: string | null
          operation_name_ar: string | null
          performed_by_name: string | null
          performed_on: string | null
          phi_days: number | null
          product_name: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          rows_scope: string | null
          target_pest_id: string | null
          total_quantity: number | null
          total_unit: string | null
          water_volume_l: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_target_pest_id_fkey"
            columns: ["target_pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
        ]
      }
      v_crop_weekly_summary: {
        Row: {
          avg_flowering_height_cm: number | null
          avg_flowering_rate: number | null
          avg_flowering_truss_no: number | null
          avg_fruit_set_pct: number | null
          avg_fruits_on_plant: number | null
          avg_harvest_truss_no: number | null
          avg_leaves_remaining: number | null
          avg_leaves_removed: number | null
          avg_open_flowers: number | null
          avg_stem_diameter_mm: number | null
          avg_weekly_growth_cm: number | null
          balance_score: number | null
          balance_status: string | null
          crop_cycle_id: string | null
          farm_id: string | null
          greenhouse_id: string | null
          iso_week: number | null
          iso_year: number | null
          plants_measured: number | null
          sig_diameter: number | null
          sig_flowering_height: number | null
          sig_growth: number | null
          week_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_measurements_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      v_greenhouse_phi_status: {
        Row: {
          farm_id: string | null
          greenhouse_id: string | null
          harvest_allowed_from: string | null
          harvest_blocked_today: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pest_weekly: {
        Row: {
          avg_severity: number | null
          avg_trap_count: number | null
          category: Database["public"]["Enums"]["pest_category"] | null
          crop_cycle_id: string | null
          farm_id: string | null
          greenhouse_id: string | null
          hotspots: number | null
          incidence_pct: number | null
          iso_week: number | null
          iso_year: number | null
          max_severity: number | null
          observations: number | null
          pest_id: string | null
          pest_name_ar: string | null
          plants_infested: number | null
          plants_inspected: number | null
          rows_affected: number | null
          week_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scouting_observations_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_sessions_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "scouting_sessions_greenhouse_id_farm_id_fkey"
            columns: ["greenhouse_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "greenhouses"
            referencedColumns: ["id", "farm_id"]
          },
        ]
      }
      v_plant_measurements: {
        Row: {
          created_at: string | null
          created_by: string | null
          crop_cycle_id: string | null
          crop_id: string | null
          deleted_at: string | null
          device_id: string | null
          extra: Json | null
          farm_id: string | null
          flowering_rate_per_week: number | null
          flowering_truss_height_cm: number | null
          flowering_truss_no: number | null
          fruit_set_pct: number | null
          fruits_on_plant: number | null
          greenhouse_id: string | null
          growth_from_height_cm: number | null
          harvest_truss_no: number | null
          id: string | null
          iso_week: number | null
          iso_year: number | null
          leaf_count_remaining: number | null
          leaf_count_total: number | null
          leaves_removed: number | null
          measured_on: string | null
          notes: string | null
          open_flowers_count: number | null
          plant_height_cm: number | null
          plant_label: string | null
          reference_plant_id: string | null
          row_no: number | null
          server_updated_at: string | null
          session_id: string | null
          set_truss_flowers: number | null
          set_truss_fruits: number | null
          set_truss_no: number | null
          stem_diameter_mm: number | null
          updated_at: string | null
          updated_by: string | null
          variety_id: string | null
          weekly_growth_cm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_measurements_crop_cycle_id_farm_id_fkey"
            columns: ["crop_cycle_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id", "farm_id"]
          },
          {
            foreignKeyName: "plant_measurements_reference_plant_id_crop_cycle_id_fkey"
            columns: ["reference_plant_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "reference_plants"
            referencedColumns: ["id", "crop_cycle_id"]
          },
          {
            foreignKeyName: "plant_measurements_session_id_crop_cycle_id_fkey"
            columns: ["session_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_registration_sessions"
            referencedColumns: ["id", "crop_cycle_id"]
          },
        ]
      }
      v_spray_moa_counts: {
        Row: {
          applications: number | null
          crop_cycle_id: string | null
          farm_id: string | null
          first_on: string | null
          greenhouse_id: string | null
          last_on: string | null
          moa_code: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_invitation_for_email: {
        Args: { p_email: string }
        Returns: undefined
      }
      server_now: { Args: never; Returns: string }
    }
    Enums: {
      activity_type:
        | "chemical_spray"
        | "fertigation_injection"
        | "bio_release"
        | "cultural_operation"
      application_method:
        | "foliar_spray"
        | "fogging"
        | "drench"
        | "fertigation"
        | "release"
        | "manual"
      count_unit:
        | "per_leaf"
        | "per_plant"
        | "per_flower"
        | "per_trap"
        | "percent_plants"
        | "presence"
      crop_cycle_status: "planned" | "active" | "finished"
      dose_unit:
        | "ml_per_l"
        | "g_per_l"
        | "ml_per_100l"
        | "g_per_100l"
        | "l_per_feddan"
        | "kg_per_feddan"
        | "ml_per_feddan"
        | "g_per_feddan"
        | "l_per_ha"
        | "kg_per_ha"
        | "individuals_per_m2"
        | "individuals_total"
        | "units_per_greenhouse"
        | "hives"
        | "other"
      member_role:
        | "admin"
        | "farm_manager"
        | "consultant"
        | "scout"
        | "executive"
      operation_category:
        | "establishment"
        | "crop_maintenance"
        | "pollination"
        | "hygiene"
        | "harvest"
        | "other"
      pest_category:
        | "insect"
        | "mite"
        | "fungus"
        | "oomycete"
        | "bacteria"
        | "virus"
        | "nematode"
        | "physiological"
        | "other"
      priority_level: "low" | "normal" | "high" | "urgent"
      product_type:
        | "insecticide"
        | "acaricide"
        | "fungicide"
        | "bactericide"
        | "nematicide"
        | "herbicide"
        | "fertilizer"
        | "biostimulant"
        | "biocontrol_agent"
        | "pollinator"
        | "adjuvant"
        | "other"
      recommendation_status: "open" | "in_progress" | "done" | "cancelled"
      scouting_method:
        | "plant_inspection"
        | "sticky_trap"
        | "pheromone_trap"
        | "indicator_plant"
      substrate_type:
        | "soil"
        | "cocopeat"
        | "rockwool"
        | "volcanic_tuff"
        | "perlite"
        | "other"
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
      activity_type: [
        "chemical_spray",
        "fertigation_injection",
        "bio_release",
        "cultural_operation",
      ],
      application_method: [
        "foliar_spray",
        "fogging",
        "drench",
        "fertigation",
        "release",
        "manual",
      ],
      count_unit: [
        "per_leaf",
        "per_plant",
        "per_flower",
        "per_trap",
        "percent_plants",
        "presence",
      ],
      crop_cycle_status: ["planned", "active", "finished"],
      dose_unit: [
        "ml_per_l",
        "g_per_l",
        "ml_per_100l",
        "g_per_100l",
        "l_per_feddan",
        "kg_per_feddan",
        "ml_per_feddan",
        "g_per_feddan",
        "l_per_ha",
        "kg_per_ha",
        "individuals_per_m2",
        "individuals_total",
        "units_per_greenhouse",
        "hives",
        "other",
      ],
      member_role: [
        "admin",
        "farm_manager",
        "consultant",
        "scout",
        "executive",
      ],
      operation_category: [
        "establishment",
        "crop_maintenance",
        "pollination",
        "hygiene",
        "harvest",
        "other",
      ],
      pest_category: [
        "insect",
        "mite",
        "fungus",
        "oomycete",
        "bacteria",
        "virus",
        "nematode",
        "physiological",
        "other",
      ],
      priority_level: ["low", "normal", "high", "urgent"],
      product_type: [
        "insecticide",
        "acaricide",
        "fungicide",
        "bactericide",
        "nematicide",
        "herbicide",
        "fertilizer",
        "biostimulant",
        "biocontrol_agent",
        "pollinator",
        "adjuvant",
        "other",
      ],
      recommendation_status: ["open", "in_progress", "done", "cancelled"],
      scouting_method: [
        "plant_inspection",
        "sticky_trap",
        "pheromone_trap",
        "indicator_plant",
      ],
      substrate_type: [
        "soil",
        "cocopeat",
        "rockwool",
        "volcanic_tuff",
        "perlite",
        "other",
      ],
    },
  },
} as const
