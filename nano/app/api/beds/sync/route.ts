import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Manual bed data refresh triggered')
    
    // Since we're using WebSocket, this endpoint just returns current status
    return NextResponse.json({ 
      success: true, 
      message: 'WebSocket connection handles real-time data',
      note: 'Data is updated automatically via WebSocket connection',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual refresh error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to refresh bed data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Return sample data for testing when WebSocket is not available
    const sampleBeds = [
      {
        "id": 1,
        "patientId": "P001",
        "patientName": "John Doe",
        "case": "stable",
        "admissionTime": "2025-12-26T13:31:08.339Z",
        "vitals": {
          "heartRate": 77,
          "bloodPressure": { "systolic": 119, "diastolic": 84 },
          "oxygenSaturation": 97,
          "temperature": 98.8,
          "respiratoryRate": 16,
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
          "heartRate": 104,
          "bloodPressure": { "systolic": 125, "diastolic": 76 },
          "oxygenSaturation": 88,
          "temperature": 99.3,
          "respiratoryRate": 31,
          "timestamp": new Date().toISOString()
        },
        "status": "critical"
      }
    ]
    
    return NextResponse.json({ 
      success: true,
      beds: sampleBeds,
      count: sampleBeds.length,
      timestamp: new Date().toISOString(),
      note: 'Sample data - real data comes via WebSocket'
    })

  } catch (error) {
    console.error('Fetch bed data error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch bed data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}