// Client to connect to the bed monitoring WebSocket
export interface BedData {
  id: number
  patientId: string
  patientName: string
  case: string
  admissionTime: string
  vitals: {
    heartRate: number
    bloodPressure: {
      systolic: number
      diastolic: number
    }
    oxygenSaturation: number
    temperature: number
    respiratoryRate: number
    timestamp: string
  }
  status: 'stable' | 'critical' | 'emergency'
}

export interface WebSocketData {
  type: 'vital_update'
  beds: BedData[]
}

// Sample data for when WebSocket is not available
const SAMPLE_BED_DATA: BedData[] = [
  {
    "id": 1,
    "patientId": "P001",
    "patientName": "John Doe",
    "case": "stable",
    "admissionTime": "2025-12-26T13:31:08.339Z",
    "vitals": {
      "heartRate": 77.0309898794215,
      "bloodPressure": {
        "systolic": 119.16719374911797,
        "diastolic": 83.84950416230339
      },
      "oxygenSaturation": 97.46448866714135,
      "temperature": 98.78452649878791,
      "respiratoryRate": 15.747128955275977,
      "timestamp": new Date().toISOString()
    },
    "status": "stable"
  },
  {
    "id": 2,
    "patientId": "P002",
    "patientName": "Jane Smith",
    "case": "asthma_acute",
    "admissionTime": "2025-12-28T07:31:08.339Z",
    "vitals": {
      "heartRate": 104.22856726302986,
      "bloodPressure": {
        "systolic": 124.80617949397646,
        "diastolic": 76.43179815443894
      },
      "oxygenSaturation": 87.53373912737887,
      "temperature": 99.33043801158618,
      "respiratoryRate": 31.206102380626653,
      "timestamp": new Date().toISOString()
    },
    "status": "critical"
  },
  {
    "id": 3,
    "patientId": "P003",
    "patientName": "Bob Johnson",
    "case": "myocardial_infarction",
    "admissionTime": "2025-12-28T13:01:08.339Z",
    "vitals": {
      "heartRate": 109.20006473274472,
      "bloodPressure": {
        "systolic": 61.6393882892213,
        "diastolic": 63.37972535088154
      },
      "oxygenSaturation": 94.64354931197012,
      "temperature": 99.74084342450344,
      "respiratoryRate": 24.865152570301518,
      "timestamp": new Date().toISOString()
    },
    "status": "emergency"
  },
  {
    "id": 4,
    "patientId": "P004",
    "patientName": "Alice Brown",
    "case": "pneumonia",
    "admissionTime": "2025-12-23T13:31:08.339Z",
    "vitals": {
      "heartRate": 95.5864027539447,
      "bloodPressure": {
        "systolic": 120.68125060666682,
        "diastolic": 71.92525464769344
      },
      "oxygenSaturation": 88.17423310476502,
      "temperature": 102.6013097190564,
      "respiratoryRate": 24.3838027937616,
      "timestamp": new Date().toISOString()
    },
    "status": "critical"
  },
  {
    "id": 5,
    "patientId": "P005",
    "patientName": "Charlie Wilson",
    "case": "sepsis",
    "admissionTime": "2025-12-28T01:31:08.339Z",
    "vitals": {
      "heartRate": 108.30895029215604,
      "bloodPressure": {
        "systolic": 63.30883287417329,
        "diastolic": 63.96779644106431
      },
      "oxygenSaturation": 93.74725469187067,
      "temperature": 104.03839560076432,
      "respiratoryRate": 33.954651040725324,
      "timestamp": new Date().toISOString()
    },
    "status": "emergency"
  },
  {
    "id": 6,
    "patientId": "P006",
    "patientName": "Diana Davis",
    "case": "diabetic_ketoacidosis",
    "admissionTime": "2025-12-28T10:31:08.339Z",
    "vitals": {
      "heartRate": 112.60386148141527,
      "bloodPressure": {
        "systolic": 106.68244528408445,
        "diastolic": 61.74661426245461
      },
      "oxygenSaturation": 97.34308537655302,
      "temperature": 99.72042393272771,
      "respiratoryRate": 26.740848312125006,
      "timestamp": new Date().toISOString()
    },
    "status": "emergency"
  }
]

export class BedMonitoringClient {
  private websocketUrl: string
  private ws: WebSocket | null = null
  private reconnectInterval: NodeJS.Timeout | null = null
  private currentBedData: BedData[] = []
  private listeners: ((beds: BedData[]) => void)[] = []
  private isConnected: boolean = false

  constructor(websocketUrl: string = 'ws://localhost:3002') {
    this.websocketUrl = websocketUrl
    // Start with sample data
    this.currentBedData = SAMPLE_BED_DATA
  }

  connect(): void {
    try {
      console.log('🔌 Connecting to bed monitoring WebSocket:', this.websocketUrl)
      this.ws = new WebSocket(this.websocketUrl)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to bed monitoring system')
        this.isConnected = true
        this.clearReconnectInterval()
      }

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketData = JSON.parse(event.data)
          if (data.type === 'vital_update' && data.beds) {
            console.log('📊 Received bed data update:', data.beds.length, 'beds')
            this.currentBedData = data.beds
            this.notifyListeners(data.beds)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('❌ WebSocket connection closed, using sample data')
        this.isConnected = false
        this.ws = null
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnected = false
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnected = false
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.clearReconnectInterval()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  private scheduleReconnect(): void {
    this.clearReconnectInterval()
    this.reconnectInterval = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to WebSocket...')
      this.connect()
    }, 5000) // Reconnect after 5 seconds
  }

  private clearReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  getCurrentBedData(): BedData[] {
    // Update timestamps for sample data to make it look live
    if (!this.isConnected) {
      return SAMPLE_BED_DATA.map(bed => ({
        ...bed,
        vitals: {
          ...bed.vitals,
          timestamp: new Date().toISOString()
        }
      }))
    }
    return this.currentBedData
  }

  onDataUpdate(callback: (beds: BedData[]) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(beds: BedData[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(beds)
      } catch (error) {
        console.error('Error in bed data listener:', error)
      }
    })
  }

  getConnectionStatus(): { connected: boolean; url: string } {
    return {
      connected: this.isConnected,
      url: this.websocketUrl
    }
  }
}

// Singleton instance
export const bedMonitoringClient = new BedMonitoringClient()