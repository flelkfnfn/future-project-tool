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

type ChatMessages = {
  Row: { id: string; text: string; user: string; ts: number }
  Insert: { id: string; text: string; user: string; ts: number }
  Update: Partial<ChatMessages['Insert']>
}

export type Database = {
  public: {
    Tables: { chat_messages: ChatMessages } & Record<string, TableLike>
    Views: Record<string, TableLike>
    Functions: Record<string, unknown>
    Enums: Record<string, string | number>
    CompositeTypes: Record<string, unknown>
  }
}
