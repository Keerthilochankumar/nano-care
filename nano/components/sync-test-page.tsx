'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw, Database, Wifi } from 'lucide-react'

interface BedData {
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

export default function SyncTestPage() {
  const [bedData, setBedData] = useState<BedData[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const fetchBedData = async () => {
    setLoading(true)
    try {
      // Import WebSocket client dynamically
      const { bedMonitoringClient } = await import('@/lib/websocket-client')
      const beds = bedMonitoringClient.getCurrentBedData()
      setBedData(beds)
      console.log('Fetched current bed data:', beds.length, 'beds')
    } catch (error) {
      console.error('Error fetching bed data:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = async () => {
    setSyncing(true)
    try {
      const { bedMonitoringClient } = await import('@/lib/websocket-client')
      
      // Set up real-time listener
      const unsubscribe = bedMonitoringClient.onDataUpdate((beds) => {
        setBedData(beds)
        setLastSync(new Date().toLocaleString())
        console.log('WebSocket data update:', beds.length, 'beds')
      })
      
      // Connect to WebSocket
      bedMonitoringClient.connect()
      
      // Get initial data
      const initialBeds = bedMonitoringClient.getCurrentBedData()
      setBedData(initialBeds)
      setLastSync(new Date().toLocaleString())
      
      console.log('WebSocket connected and listening for updates')
    } catch (error) {
      console.error('Error connecting WebSocket:', error)
    } finally {
      setSyncing(false)
    }
  }

  const syncToDatabase = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/beds/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beds: bedData })
      })
      
      if (response.ok) {
        setLastSync(new Date().toLocaleString())
        console.log('Successfully synced to database')
      } else {
        console.error('Failed to sync to database')
      }
    } catch (error) {
      console.error('Error syncing to database:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emergency': return 'bg-red-600 text-white'
      case 'critical': return 'bg-orange-500 text-white'
      case 'stable': return 'bg-green-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bed Data WebSocket Test</h1>
          <div className="flex space-x-4">
            <Button onClick={fetchBedData} disabled={loading}>
              {loading ? (
                <Activity className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Get Current Data
            </Button>
            <Button onClick={connectWebSocket} disabled={syncing} variant="outline">
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Connect WebSocket
            </Button>
            <Button onClick={syncToDatabase} disabled={syncing} variant="outline">
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Sync to Database
            </Button>
          </div>
          {lastSync && (
            <p className="text-sm text-gray-600 mt-2">Last update: {lastSync}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bedData.map((bed) => (
            <Card key={bed.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Bed {bed.id} - {bed.patientName}
                  </CardTitle>
                  <Badge className={getStatusColor(bed.status)}>
                    {bed.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {bed.case.replace('_', ' ')} • {bed.patientId}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">HR:</span> {Math.round(bed.vitals.heartRate)}
                    </div>
                    <div>
                      <span className="font-medium">BP:</span> {Math.round(bed.vitals.bloodPressure.systolic)}/{Math.round(bed.vitals.bloodPressure.diastolic)}
                    </div>
                    <div>
                      <span className="font-medium">SpO2:</span> {Math.round(bed.vitals.oxygenSaturation)}%
                    </div>
                    <div>
                      <span className="font-medium">RR:</span> {Math.round(bed.vitals.respiratoryRate)}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Temp:</span> {bed.vitals.temperature.toFixed(1)}°F
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Admitted: {new Date(bed.admissionTime).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last update: {new Date(bed.vitals.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {bedData.length === 0 && !loading && (
          <div className="text-center py-12">
            <Wifi className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No bed data available. Click "Connect WebSocket" to start receiving real-time data.</p>
          </div>
        )}
      </div>
    </div>
  )
}