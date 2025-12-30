// Test script to simulate webhook data
const testData = {
  "type": "vital_update",
  "beds": [
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
        "timestamp": "2025-12-28T13:56:43.858Z"
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
        "timestamp": "2025-12-28T13:56:43.858Z"
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
        "timestamp": "2025-12-28T13:56:43.858Z"
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
        "timestamp": "2025-12-28T13:56:43.858Z"
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
        "timestamp": "2025-12-28T13:56:43.858Z"
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
        "timestamp": "2025-12-28T13:56:43.858Z"
      },
      "status": "emergency"
    }
  ]
}

async function testWebhook() {
  try {
    console.log('Testing webhook with sample data...')
    
    const response = await fetch('http://localhost:3000/api/webhook/beds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Webhook test successful:', result)
    } else {
      console.error('❌ Webhook test failed:', response.status, response.statusText)
      const error = await response.text()
      console.error('Error details:', error)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Run the test
testWebhook()