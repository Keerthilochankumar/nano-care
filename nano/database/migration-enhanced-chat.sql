-- Migration to add enhanced chat functionality
-- Run this in your Supabase SQL editor

-- Drop existing patient_documents table if it exists (backup data first if needed)
DROP TABLE IF EXISTS patient_documents CASCADE;

-- Create updated patient_documents table for file uploads
CREATE TABLE patient_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL, -- Using patient ID from WebSocket data
  uploaded_by VARCHAR(255) NOT NULL, -- Clerk user ID
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  raw_content TEXT,
  processed BOOLEAN DEFAULT FALSE,
  processed_content TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_history table
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL, -- Using patient ID from WebSocket data
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  rag_used BOOLEAN DEFAULT FALSE,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_uploaded_by ON patient_documents(uploaded_by);
CREATE INDEX idx_patient_documents_created_at ON patient_documents(created_at);
CREATE INDEX idx_chat_history_patient_id ON chat_history(patient_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);

-- Enable Row Level Security
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to manage their own uploaded documents
CREATE POLICY "Users can manage their own documents" ON patient_documents
  FOR ALL TO authenticated USING (auth.uid()::text = uploaded_by);

-- Allow users to manage their own chat history
CREATE POLICY "Users can manage their own chat history" ON chat_history
  FOR ALL TO authenticated USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_patient_documents_updated_at BEFORE UPDATE ON patient_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON patient_documents TO authenticated;
GRANT ALL ON chat_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;