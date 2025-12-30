# ICU Bed Monitoring System

A real-time bed monitoring system simulation for ICU environments with WebSocket live data streaming.

## Features

- **Real-time Monitoring**: Live vital signs updates every 2 seconds via WebSocket
- **Multiple Patient Cases**: Simulate different patient conditions (Stable, Critical, Emergency, Recovering)
- **Clean Hospital UI**: Professional medical interface with clean white cards and hospital color scheme
- **Dashboard Overview**: Clear summary statistics and critical alerts with medical-standard indicators
- **Individual Bed Monitors**: Easy-to-read vital signs with color-coded status (green=normal, orange=warning, red=critical)
- **Case Simulation**: Switch between different patient scenarios in real-time
- **Critical Alerts**: Medical-standard alert system with clear visual indicators
- **Responsive Design**: Optimized for desktop and mobile devices
- **Medical Color Coding**: Industry-standard colors for easy interpretation
- **Subtle Animations**: Gentle heartbeat and breathing animations for active monitoring

## Patient Cases

### Stable Patient
- Heart Rate: 70-80 bpm
- Blood Pressure: 110-130/75-85 mmHg
- Oxygen Saturation: 97-99%
- Temperature: 98.1-99.1°F
- Respiratory Rate: 14-18 breaths/min

### Critical Patient
- Heart Rate: 95-125 bpm
- Blood Pressure: 75-105/50-70 mmHg
- Oxygen Saturation: 85-91%
- Temperature: 100.2-102.2°F
- Respiratory Rate: 20-28 breaths/min

### Emergency Patient
- Heart Rate: 120-160 bpm
- Blood Pressure: 50-90/30-60 mmHg
- Oxygen Saturation: 77-87%
- Temperature: 102-105°F
- Respiratory Rate: 26-38 breaths/min

### Recovering Patient
- Heart Rate: 77-93 bpm
- Blood Pressure: 102-118/70-80 mmHg
- Oxygen Saturation: 93-97%
- Temperature: 98.3-99.9°F
- Respiratory Rate: 15-21 breaths/min

## Technology Stack

- **Frontend**: React 19, Tailwind CSS, Vite
- **Backend**: Node.js, Express, WebSocket (ws)
- **Real-time Communication**: WebSocket for live data streaming

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Option 1: Run both server and client together
```bash
npm run dev:full
```

#### Option 2: Run separately
1. Start the WebSocket server:
   ```bash
   npm run server
   ```

2. In a new terminal, start the React development server:
   ```bash
   npm run dev
   ```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## API Endpoints

- `GET /api/beds` - Get all bed data with current vital signs
- `POST /api/beds/:id/case` - Update patient case simulation for a specific bed

## WebSocket Events

### Client Receives:
- `initial_data` - Initial bed data when connecting
- `vital_update` - Real-time vital signs updates every 2 seconds

### Message Format:
```json
{
  "type": "vital_update",
  "beds": [
    {
      "id": 1,
      "patientId": "P001",
      "patientName": "John Doe",
      "case": "stable",
      "status": "stable",
      "admissionTime": "2024-10-28T10:00:00.000Z",
      "vitals": {
        "heartRate": 75,
        "bloodPressure": {
          "systolic": 120,
          "diastolic": 80
        },
        "oxygenSaturation": 98,
        "temperature": 98.6,
        "respiratoryRate": 16,
        "timestamp": "2024-10-30T15:30:00.000Z"
      }
    }
  ]
}
```

## Features in Detail

### Dashboard
- Total bed count
- Critical alerts counter
- Patient status distribution
- Average vital signs across all patients
- Real-time critical alerts with patient details

### Bed Monitors
- Individual patient information
- Real-time vital signs with color-coded status indicators
- Case simulation controls
- Last update timestamps
- Critical value highlighting

### Critical Alert System
- Automatic detection of abnormal vital signs:
  - Heart Rate: < 50 or > 120 bpm
  - Oxygen Saturation: < 90%
  - Temperature: < 96°F or > 101°F
  - Respiratory Rate: < 10 or > 24 breaths/min

## Customization

You can modify the patient simulation parameters in `server/index.js` by updating the `patientCases` object to adjust vital sign ranges for different scenarios.

## Development

The system uses:
- React with functional components and hooks
- Tailwind CSS for styling
- WebSocket for real-time communication
- Express.js for the backend API
- Simulated patient data with realistic vital sign variations

## Future Enhancements

- Historical data charts
- Medication tracking
- Nurse call system integration
- Mobile responsive design improvements
- Database integration for persistent data
- User authentication and role-based access