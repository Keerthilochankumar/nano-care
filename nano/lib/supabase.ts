import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase

// Database types
export interface Patient {
  id: string
  bed_number: string
  name: string
  age: number
  sex: 'M' | 'F' | 'Other'
  weight?: number
  admission_date: string
  admission_diagnosis: string
  ward: string
  attending_team: string
  problem_list: string[]
  comorbidities: string[]
  active_issues: string[]
  medications: string[]
  allergies: string[]
  code_status: string
  important_events: string[]
  created_at: string
  updated_at: string
}

export interface PatientDocument {
  id: string
  patient_id: string
  type: 'lab_report' | 'imaging_report' | 'progress_note' | 'discharge_summary' | 'medication_list' | 'clinical_letter'
  title: string
  content: string
  timestamp: string
  metadata: Record<string, any>
  created_at: string
}

export interface VitalSigns {
  id: string
  patient_id: string
  heart_rate?: number
  systolic_bp?: number
  diastolic_bp?: number
  map?: number
  spo2?: number
  respiratory_rate?: number
  temperature?: number
  ventilator_mode?: string
  ventilator_settings?: Record<string, any>
  alarms: string[]
  timestamp: string
  created_at: string
}

export interface ICUSession {
  id: string
  user_id: string
  patient_id: string
  started_at: string
  ended_at?: string
  session_notes?: string
}