// Permissive Supabase Database type to satisfy generics without using `any`.
// Replace with generated types from Supabase when available.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

type TableLike = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
}

export type Database = {
  public: {
    Tables: Record<string, TableLike>
    Views: Record<string, TableLike>
    Functions: Record<string, unknown>
    Enums: Record<string, string | number>
    CompositeTypes: Record<string, unknown>
  }
}
