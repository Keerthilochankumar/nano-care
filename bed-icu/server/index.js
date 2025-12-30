import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Comprehensive Patient Medical Conditions
const patientCases = {
  // General Status
  stable: {
    heartRate: { base: 75, variance: 5 },
    bloodPressure: { systolic: { base: 120, variance: 10 }, diastolic: { base: 80, variance: 5 } },
    oxygenSaturation: { base: 98, variance: 1 },
    temperature: { base: 98.6, variance: 0.5 },
    respiratoryRate: { base: 16, variance: 2 },
    status: 'stable',
    description: 'Normal vital signs'
  },
  
  // Respiratory Conditions
  asthma_acute: {
    heartRate: { base: 105, variance: 12 },
    bloodPressure: { systolic: { base: 135, variance: 15 }, diastolic: { base: 85, variance: 10 } },
    oxygenSaturation: { base: 91, variance: 4 },
    temperature: { base: 98.8, variance: 0.8 },
    respiratoryRate: { base: 28, variance: 6 },
    status: 'critical',
    description: 'Acute asthma exacerbation'
  },
  pneumonia: {
    heartRate: { base: 95, variance: 10 },
    bloodPressure: { systolic: { base: 110, variance: 12 }, diastolic: { base: 70, variance: 8 } },
    oxygenSaturation: { base: 89, variance: 3 },
    temperature: { base: 102.1, variance: 1.2 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'critical',
    description: 'Bacterial pneumonia'
  },
  copd_exacerbation: {
    heartRate: { base: 88, variance: 8 },
    bloodPressure: { systolic: { base: 145, variance: 18 }, diastolic: { base: 90, variance: 12 } },
    oxygenSaturation: { base: 86, variance: 4 },
    temperature: { base: 99.2, variance: 0.9 },
    respiratoryRate: { base: 26, variance: 5 },
    status: 'critical',
    description: 'COPD acute exacerbation'
  },
  pulmonary_embolism: {
    heartRate: { base: 125, variance: 15 },
    bloodPressure: { systolic: { base: 95, variance: 20 }, diastolic: { base: 60, variance: 15 } },
    oxygenSaturation: { base: 84, variance: 5 },
    temperature: { base: 99.5, variance: 1 },
    respiratoryRate: { base: 30, variance: 6 },
    status: 'emergency',
    description: 'Acute pulmonary embolism'
  },
  
  // Cardiovascular Conditions
  myocardial_infarction: {
    heartRate: { base: 110, variance: 20 },
    bloodPressure: { systolic: { base: 85, variance: 25 }, diastolic: { base: 55, variance: 20 } },
    oxygenSaturation: { base: 94, variance: 3 },
    temperature: { base: 99.8, variance: 1 },
    respiratoryRate: { base: 22, variance: 4 },
    status: 'emergency',
    description: 'Acute myocardial infarction'
  },
  heart_failure: {
    heartRate: { base: 92, variance: 12 },
    bloodPressure: { systolic: { base: 100, variance: 15 }, diastolic: { base: 65, variance: 10 } },
    oxygenSaturation: { base: 90, variance: 3 },
    temperature: { base: 98.9, variance: 0.7 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'critical',
    description: 'Congestive heart failure'
  },
  atrial_fibrillation: {
    heartRate: { base: 135, variance: 25 },
    bloodPressure: { systolic: { base: 140, variance: 20 }, diastolic: { base: 85, variance: 15 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 98.7, variance: 0.6 },
    respiratoryRate: { base: 20, variance: 3 },
    status: 'critical',
    description: 'Atrial fibrillation with RVR'
  },
  hypertensive_crisis: {
    heartRate: { base: 105, variance: 15 },
    bloodPressure: { systolic: { base: 185, variance: 25 }, diastolic: { base: 115, variance: 20 } },
    oxygenSaturation: { base: 97, variance: 2 },
    temperature: { base: 99.2, variance: 0.8 },
    respiratoryRate: { base: 22, variance: 3 },
    status: 'emergency',
    description: 'Hypertensive emergency'
  },
  
  // Infectious Diseases
  sepsis: {
    heartRate: { base: 125, variance: 20 },
    bloodPressure: { systolic: { base: 80, variance: 20 }, diastolic: { base: 50, variance: 15 } },
    oxygenSaturation: { base: 92, variance: 4 },
    temperature: { base: 103.8, variance: 2 },
    respiratoryRate: { base: 28, variance: 6 },
    status: 'emergency',
    description: 'Severe sepsis'
  },
  meningitis: {
    heartRate: { base: 115, variance: 18 },
    bloodPressure: { systolic: { base: 90, variance: 18 }, diastolic: { base: 60, variance: 12 } },
    oxygenSaturation: { base: 95, variance: 2 },
    temperature: { base: 104.2, variance: 1.8 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'emergency',
    description: 'Bacterial meningitis'
  },
  influenza_severe: {
    heartRate: { base: 98, variance: 12 },
    bloodPressure: { systolic: { base: 105, variance: 12 }, diastolic: { base: 70, variance: 8 } },
    oxygenSaturation: { base: 93, variance: 3 },
    temperature: { base: 102.8, variance: 1.5 },
    respiratoryRate: { base: 22, variance: 4 },
    status: 'critical',
    description: 'Severe influenza'
  },
  
  // Neurological Conditions
  stroke_acute: {
    heartRate: { base: 88, variance: 10 },
    bloodPressure: { systolic: { base: 165, variance: 25 }, diastolic: { base: 95, variance: 15 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 99.1, variance: 0.8 },
    respiratoryRate: { base: 18, variance: 3 },
    status: 'emergency',
    description: 'Acute ischemic stroke'
  },
  seizure_status: {
    heartRate: { base: 140, variance: 25 },
    bloodPressure: { systolic: { base: 155, variance: 30 }, diastolic: { base: 95, variance: 20 } },
    oxygenSaturation: { base: 88, variance: 5 },
    temperature: { base: 100.5, variance: 1.2 },
    respiratoryRate: { base: 26, variance: 6 },
    status: 'emergency',
    description: 'Status epilepticus'
  },
  head_trauma: {
    heartRate: { base: 65, variance: 8 },
    bloodPressure: { systolic: { base: 170, variance: 20 }, diastolic: { base: 100, variance: 15 } },
    oxygenSaturation: { base: 97, variance: 2 },
    temperature: { base: 98.2, variance: 0.6 },
    respiratoryRate: { base: 14, variance: 2 },
    status: 'emergency',
    description: 'Severe head trauma with ICP'
  },
  
  // Metabolic Conditions
  diabetic_ketoacidosis: {
    heartRate: { base: 115, variance: 15 },
    bloodPressure: { systolic: { base: 95, variance: 15 }, diastolic: { base: 60, variance: 10 } },
    oxygenSaturation: { base: 98, variance: 1 },
    temperature: { base: 99.8, variance: 1 },
    respiratoryRate: { base: 28, variance: 5 },
    status: 'emergency',
    description: 'Diabetic ketoacidosis'
  },
  hypoglycemia_severe: {
    heartRate: { base: 105, variance: 18 },
    bloodPressure: { systolic: { base: 110, variance: 20 }, diastolic: { base: 70, variance: 15 } },
    oxygenSaturation: { base: 98, variance: 1 },
    temperature: { base: 97.8, variance: 0.8 },
    respiratoryRate: { base: 20, variance: 3 },
    status: 'critical',
    description: 'Severe hypoglycemia'
  },
  thyroid_storm: {
    heartRate: { base: 155, variance: 25 },
    bloodPressure: { systolic: { base: 160, variance: 25 }, diastolic: { base: 90, variance: 15 } },
    oxygenSaturation: { base: 97, variance: 2 },
    temperature: { base: 104.8, variance: 2 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'emergency',
    description: 'Thyroid storm'
  },
  
  // Renal Conditions
  acute_kidney_injury: {
    heartRate: { base: 95, variance: 12 },
    bloodPressure: { systolic: { base: 155, variance: 20 }, diastolic: { base: 95, variance: 15 } },
    oxygenSaturation: { base: 94, variance: 3 },
    temperature: { base: 99.5, variance: 1 },
    respiratoryRate: { base: 22, variance: 4 },
    status: 'critical',
    description: 'Acute kidney injury'
  },
  
  // Gastrointestinal Conditions
  gi_bleeding: {
    heartRate: { base: 125, variance: 20 },
    bloodPressure: { systolic: { base: 85, variance: 20 }, diastolic: { base: 55, variance: 15 } },
    oxygenSaturation: { base: 95, variance: 3 },
    temperature: { base: 98.2, variance: 0.8 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'emergency',
    description: 'Upper GI bleeding'
  },
  pancreatitis_acute: {
    heartRate: { base: 105, variance: 15 },
    bloodPressure: { systolic: { base: 100, variance: 15 }, diastolic: { base: 65, variance: 10 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 101.5, variance: 1.2 },
    respiratoryRate: { base: 20, variance: 3 },
    status: 'critical',
    description: 'Acute pancreatitis'
  },
  
  // Trauma Conditions
  hemorrhagic_shock: {
    heartRate: { base: 135, variance: 25 },
    bloodPressure: { systolic: { base: 70, variance: 20 }, diastolic: { base: 45, variance: 15 } },
    oxygenSaturation: { base: 92, variance: 4 },
    temperature: { base: 97.5, variance: 1 },
    respiratoryRate: { base: 28, variance: 6 },
    status: 'emergency',
    description: 'Hemorrhagic shock'
  },
  
  // Drug-Related Conditions
  opioid_overdose: {
    heartRate: { base: 55, variance: 10 },
    bloodPressure: { systolic: { base: 90, variance: 15 }, diastolic: { base: 60, variance: 10 } },
    oxygenSaturation: { base: 85, variance: 5 },
    temperature: { base: 97.2, variance: 0.8 },
    respiratoryRate: { base: 8, variance: 3 },
    status: 'emergency',
    description: 'Opioid overdose'
  },
  alcohol_withdrawal: {
    heartRate: { base: 115, variance: 20 },
    bloodPressure: { systolic: { base: 150, variance: 25 }, diastolic: { base: 90, variance: 15 } },
    oxygenSaturation: { base: 97, variance: 2 },
    temperature: { base: 100.2, variance: 1.5 },
    respiratoryRate: { base: 22, variance: 4 },
    status: 'critical',
    description: 'Severe alcohol withdrawal'
  },
  
  // Psychiatric Emergencies
  serotonin_syndrome: {
    heartRate: { base: 130, variance: 20 },
    bloodPressure: { systolic: { base: 145, variance: 20 }, diastolic: { base: 85, variance: 15 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 102.5, variance: 1.8 },
    respiratoryRate: { base: 24, variance: 4 },
    status: 'emergency',
    description: 'Serotonin syndrome'
  },
  
  // Hematological Conditions
  anemia_severe: {
    heartRate: { base: 110, variance: 15 },
    bloodPressure: { systolic: { base: 100, variance: 12 }, diastolic: { base: 65, variance: 8 } },
    oxygenSaturation: { base: 94, variance: 2 },
    temperature: { base: 98.4, variance: 0.6 },
    respiratoryRate: { base: 22, variance: 3 },
    status: 'critical',
    description: 'Severe anemia'
  },
  
  // Electrolyte Imbalances
  hyperkalemia: {
    heartRate: { base: 65, variance: 12 },
    bloodPressure: { systolic: { base: 110, variance: 15 }, diastolic: { base: 70, variance: 10 } },
    oxygenSaturation: { base: 98, variance: 1 },
    temperature: { base: 98.6, variance: 0.5 },
    respiratoryRate: { base: 16, variance: 2 },
    status: 'critical',
    description: 'Severe hyperkalemia'
  },
  
  // Recovery States
  post_operative: {
    heartRate: { base: 85, variance: 8 },
    bloodPressure: { systolic: { base: 115, variance: 10 }, diastolic: { base: 75, variance: 8 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 99.2, variance: 0.8 },
    respiratoryRate: { base: 18, variance: 3 },
    status: 'recovering',
    description: 'Post-operative recovery'
  },
  
  // Fever Conditions
  fever_unknown: {
    heartRate: { base: 105, variance: 12 },
    bloodPressure: { systolic: { base: 110, variance: 12 }, diastolic: { base: 70, variance: 8 } },
    oxygenSaturation: { base: 96, variance: 2 },
    temperature: { base: 102.5, variance: 1.5 },
    respiratoryRate: { base: 20, variance: 3 },
    status: 'critical',
    description: 'Fever of unknown origin'
  },
  
  // Pain Management
  chronic_pain_crisis: {
    heartRate: { base: 95, variance: 12 },
    bloodPressure: { systolic: { base: 140, variance: 18 }, diastolic: { base: 85, variance: 12 } },
    oxygenSaturation: { base: 98, variance: 1 },
    temperature: { base: 98.8, variance: 0.7 },
    respiratoryRate: { base: 20, variance: 3 },
    status: 'critical',
    description: 'Chronic pain crisis'
  }
};

// Initialize beds with diverse medical cases
const beds = [
  { id: 1, patientId: 'P001', patientName: 'John Doe', case: 'stable', admissionTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: 2, patientId: 'P002', patientName: 'Jane Smith', case: 'asthma_acute', admissionTime: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: 3, patientId: 'P003', patientName: 'Bob Johnson', case: 'myocardial_infarction', admissionTime: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 4, patientId: 'P004', patientName: 'Alice Brown', case: 'pneumonia', admissionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 5, patientId: 'P005', patientName: 'Charlie Wilson', case: 'sepsis', admissionTime: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { id: 6, patientId: 'P006', patientName: 'Diana Davis', case: 'diabetic_ketoacidosis', admissionTime: new Date(Date.now() - 3 * 60 * 60 * 1000) }
];

function generateVitalSigns(caseType) {
  const config = patientCases[caseType];
  
  return {
    heartRate: Math.max(40, Math.min(200, 
      config.heartRate.base + (Math.random() - 0.5) * 2 * config.heartRate.variance
    )),
    bloodPressure: {
      systolic: Math.max(60, Math.min(200,
        config.bloodPressure.systolic.base + (Math.random() - 0.5) * 2 * config.bloodPressure.systolic.variance
      )),
      diastolic: Math.max(40, Math.min(120,
        config.bloodPressure.diastolic.base + (Math.random() - 0.5) * 2 * config.bloodPressure.diastolic.variance
      ))
    },
    oxygenSaturation: Math.max(70, Math.min(100,
      config.oxygenSaturation.base + (Math.random() - 0.5) * 2 * config.oxygenSaturation.variance
    )),
    temperature: Math.max(95, Math.min(108,
      config.temperature.base + (Math.random() - 0.5) * 2 * config.temperature.variance
    )),
    respiratoryRate: Math.max(8, Math.min(40,
      config.respiratoryRate.base + (Math.random() - 0.5) * 2 * config.respiratoryRate.variance
    )),
    timestamp: new Date().toISOString()
  };
}

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  
  // Send initial bed data
  ws.send(JSON.stringify({
    type: 'initial_data',
    beds: beds.map(bed => ({
      ...bed,
      vitals: generateVitalSigns(bed.case),
      status: patientCases[bed.case].status
    }))
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast vital signs every 2 seconds
setInterval(() => {
  const data = {
    type: 'vital_update',
    beds: beds.map(bed => ({
      id: bed.id,
      patientId: bed.patientId,
      patientName: bed.patientName,
      case: bed.case,
      admissionTime: bed.admissionTime,
      vitals: generateVitalSigns(bed.case),
      status: patientCases[bed.case].status
    }))
  };

  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}, 2000);

// API endpoints
app.get('/api/beds', (req, res) => {
  res.json(beds.map(bed => ({
    ...bed,
    vitals: generateVitalSigns(bed.case),
    status: patientCases[bed.case].status
  })));
});

app.post('/api/beds/:id/case', (req, res) => {
  const bedId = parseInt(req.params.id);
  const { caseType } = req.body;
  
  const bed = beds.find(b => b.id === bedId);
  if (bed && patientCases[caseType]) {
    bed.case = caseType;
    res.json({ success: true, message: `Bed ${bedId} case updated to ${caseType}` });
  } else {
    res.status(400).json({ success: false, message: 'Invalid bed ID or case type' });
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}/api/beds`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`WebSocket server ready for connections`);
});