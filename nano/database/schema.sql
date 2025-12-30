-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bed_number VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(10) NOT NULL CHECK (sex IN ('M', 'F', 'Other')),
  weight DECIMAL(5,2),
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  admission_diagnosis TEXT NOT NULL,
  ward VARCHAR(100) NOT NULL,
  attending_team VARCHAR(255) NOT NULL,
  problem_list TEXT[] DEFAULT '{}',
  comorbidities TEXT[] DEFAULT '{}',
  active_issues TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  code_status VARCHAR(50) NOT NULL DEFAULT 'Full Code',
  important_events TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient_documents table (updated for file uploads)
CREATE TABLE IF NOT EXISTS patient_documents (
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
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL, -- Using patient ID from WebSocket data
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  rag_used BOOLEAN DEFAULT FALSE,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  map INTEGER,
  spo2 INTEGER,
  respiratory_rate INTEGER,
  temperature DECIMAL(4,1),
  ventilator_mode VARCHAR(50),
  ventilator_settings JSONB DEFAULT '{}',
  alarms TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create icu_sessions table
CREATE TABLE IF NOT EXISTS icu_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_bed_number ON patients(bed_number);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploaded_by ON patient_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_patient_documents_created_at ON patient_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_patient_id ON chat_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_timestamp ON vital_signs(timestamp);
CREATE INDEX IF NOT EXISTS idx_icu_sessions_user_id ON icu_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_icu_sessions_patient_id ON icu_sessions(patient_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE icu_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust based on your needs)
-- Allow authenticated users to read all patients (adjust for your access control needs)
CREATE POLICY "Allow authenticated users to read patients" ON patients
  FOR SELECT TO authenticated USING (true);

-- Allow users to manage their own uploaded documents
CREATE POLICY "Users can manage their own documents" ON patient_documents
  FOR ALL TO authenticated USING (auth.uid()::text = uploaded_by);

-- Allow users to manage their own chat history
CREATE POLICY "Users can manage their own chat history" ON chat_history
  FOR ALL TO authenticated USING (auth.uid()::text = user_id);

-- Allow authenticated users to read vital signs
CREATE POLICY "Allow authenticated users to read vital signs" ON vital_signs
  FOR SELECT TO authenticated USING (true);

-- Allow users to manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON icu_sessions
  FOR ALL TO authenticated USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_documents_updated_at BEFORE UPDATE ON patient_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO patients (bed_number, name, age, sex, weight, admission_date, admission_diagnosis, ward, attending_team, problem_list, comorbidities, active_issues, medications, allergies, code_status, important_events) VALUES
('ICU-001', 'John Doe', 65, 'M', 75.5, '2024-12-20 08:00:00+00', 'Acute respiratory failure', 'ICU', 'Dr. Smith Team', 
 ARRAY['Respiratory failure', 'Sepsis'], 
 ARRAY['COPD', 'Diabetes Type 2', 'Hypertension'], 
 ARRAY['Hypoxemia', 'Elevated lactate'], 
 ARRAY['Norepinephrine 0.1 mcg/kg/min', 'Propofol 50 mg/hr', 'Insulin sliding scale'], 
 ARRAY['Penicillin'], 
 'Full Code', 
 ARRAY['Intubated 12/20 0800', 'Central line placed 12/20 0900']),

('ICU-002', 'Jane Smith', 58, 'F', 68.0, '2024-12-21 14:30:00+00', 'Post-operative monitoring', 'ICU', 'Dr. Johnson Team',
 ARRAY['Post-op cardiac surgery'], 
 ARRAY['CAD', 'Hyperlipidemia'], 
 ARRAY['Chest tube drainage'], 
 ARRAY['Metoprolol 25mg BID', 'Atorvastatin 40mg daily'], 
 ARRAY['Shellfish'], 
 'Full Code', 
 ARRAY['CABG x3 12/21 0700', 'Extubated 12/21 1200']);

-- Insert sample documents
INSERT INTO patient_documents (patient_id, type, title, content, timestamp, metadata) VALUES
((SELECT id FROM patients WHERE bed_number = 'ICU-001'), 'lab_report', 'Morning Labs 12/28', 
 'WBC: 12.5, Hgb: 9.2, Plt: 180, Na: 138, K: 4.1, Cl: 102, CO2: 22, BUN: 25, Cr: 1.2, Glucose: 145, Lactate: 2.8', 
 '2024-12-28 06:00:00+00', '{"lab_type": "basic_metabolic", "critical_values": ["lactate"]}'),

((SELECT id FROM patients WHERE bed_number = 'ICU-001'), 'imaging_report', 'Chest X-ray 12/28', 
 'Endotracheal tube in good position. Bilateral lower lobe opacities consistent with pneumonia. No pneumothorax.', 
 '2024-12-28 07:30:00+00', '{"study_type": "chest_xray", "findings": ["pneumonia", "ett_good_position"]}');

-- Insert sample vital signs
INSERT INTO vital_signs (patient_id, heart_rate, systolic_bp, diastolic_bp, map, spo2, respiratory_rate, temperature, ventilator_mode, alarms, timestamp) VALUES
((SELECT id FROM patients WHERE bed_number = 'ICU-001'), 95, 110, 65, 80, 94, 16, 38.2, 'AC/VC', ARRAY['Low SpO2'], '2024-12-28 08:00:00+00'),
((SELECT id FROM patients WHERE bed_number = 'ICU-001'), 98, 105, 62, 76, 96, 18, 38.1, 'AC/VC', ARRAY[], '2024-12-28 08:15:00+00'),
((SELECT id FROM patients WHERE bed_number = 'ICU-002'), 72, 125, 78, 94, 98, 14, 36.8, 'Room Air', ARRAY[], '2024-12-28 08:00:00+00');