// Auto-generated TypeScript types for the Cyber × HCI Learning Companion database schema.
// Keep in sync with supabase/migrations/001_initial_schema.sql

// ────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────

export type NoteDepth = 'overview' | 'working_knowledge' | 'deep_dive'
export type KnowledgeModule = 'scenario' | 'study' | 'rabbit' | 'patterns' | 'scan'
export type DepthLevel = 'touched' | 'explored' | 'deep'
export type FeedLens = 'analyst' | 'hci' | 'commander'
export type FeedEffort = '5min' | '15min' | 'deep'

// ────────────────────────────────────────────────────────────
// Row types (what you get back from Supabase selects)
// ────────────────────────────────────────────────────────────

export interface UserRow {
  id: string
  created_at: string
  updated_at: string
}

export interface Reflection {
  question: string
  answer: string
}

export interface SavedNoteRow {
  id: string
  user_id: string
  topic: string
  depth: NoteDepth
  analyst_content: Record<string, unknown> | null
  hci_content: Record<string, unknown> | null
  reflections: Reflection[] | null
  created_at: string
}

export interface KnowledgeMapEntryRow {
  id: string
  user_id: string
  topic: string
  module: KnowledgeModule
  depth_level: DepthLevel
  visit_count: number
  last_visited: string
}

export interface ScenarioCacheRow {
  id: string
  scenario_id: string
  analysis: Record<string, unknown>
  generated_at: string
  expires_at: string
}

export interface FeedItemRow {
  id: string
  title: string
  source: string
  excerpt: string
  url: string | null
  lens: FeedLens
  effort: FeedEffort
  topic: string
  published_at: string
  is_featured: boolean
}

export interface PatternAnnotationRow {
  id: string
  user_id: string
  pattern_id: string
  notes: string
  updated_at: string
}

// ────────────────────────────────────────────────────────────
// Insert types (what you pass to Supabase inserts)
// ────────────────────────────────────────────────────────────

export type InsertUser = Pick<UserRow, 'id'>

export type InsertSavedNote = Omit<SavedNoteRow, 'id' | 'created_at'>

export type InsertKnowledgeMapEntry = Omit<KnowledgeMapEntryRow, 'id'>

export type InsertScenarioCache = Omit<ScenarioCacheRow, 'id' | 'generated_at'>

export type InsertFeedItem = Omit<FeedItemRow, 'id'>

export type InsertPatternAnnotation = Omit<PatternAnnotationRow, 'id' | 'updated_at'>

// ────────────────────────────────────────────────────────────
// Update types
// ────────────────────────────────────────────────────────────

export type UpdateSavedNote = Partial<
  Pick<SavedNoteRow, 'topic' | 'depth' | 'analyst_content' | 'hci_content' | 'reflections'>
>

export type UpdateKnowledgeMapEntry = Partial<
  Pick<KnowledgeMapEntryRow, 'depth_level' | 'visit_count' | 'last_visited'>
>

export type UpdatePatternAnnotation = Partial<Pick<PatternAnnotationRow, 'notes'>>

// ────────────────────────────────────────────────────────────
// Supabase Database type (for use with createClient<Database>)
// ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: InsertUser
        Update: Partial<Pick<UserRow, 'updated_at'>>
      }
      saved_notes: {
        Row: SavedNoteRow
        Insert: InsertSavedNote
        Update: UpdateSavedNote
      }
      knowledge_map_entries: {
        Row: KnowledgeMapEntryRow
        Insert: InsertKnowledgeMapEntry
        Update: UpdateKnowledgeMapEntry
      }
      scenario_cache: {
        Row: ScenarioCacheRow
        Insert: InsertScenarioCache
        Update: Partial<Pick<ScenarioCacheRow, 'analysis' | 'expires_at'>>
      }
      feed_items: {
        Row: FeedItemRow
        Insert: InsertFeedItem
        Update: Partial<Omit<FeedItemRow, 'id'>>
      }
      pattern_annotations: {
        Row: PatternAnnotationRow
        Insert: InsertPatternAnnotation
        Update: UpdatePatternAnnotation
      }
    }
  }
}
