import { useState, useEffect } from 'react';
import BedMonitor from './components/BedMonitor';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ConditionGuide from './components/ConditionGuide';
import './App.css';

function App() {
  const [beds, setBeds] = useState([]);
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket('ws://localhost:3002');
    
    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnectionStatus('Connected');
      setWs(websocket);
      setTimeout(() => setIsLoading(false), 1000); // Add a small delay for smooth loading
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'initial_data' || data.type === 'vital_update') {
        setBeds(data.beds);
        if (isLoading) {
          setIsLoading(false);
        }
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setConnectionStatus('Disconnected');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Error');
    };

    return () => {
      websocket.close();
    };
  }, []);

  const updatePatientCase = async (bedId, newCase) => {
    try {
      const response = await fetch(`http://localhost:3002/api/beds/${bedId}/case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caseType: newCase }),
      });
      
      if (response.ok) {
        console.log(`Updated bed ${bedId} to ${newCase} case`);
      }
    } catch (error) {
      console.error('Error updating patient case:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hospital Header */}
      <header className="bg-white shadow-sm border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">ICU Patient Monitor</h1>
                  <p className="text-sm text-gray-600">Real-time Vital Signs Monitoring</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                connectionStatus === 'Connected' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : connectionStatus === 'Error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <div className={`connection-indicator ${
                  connectionStatus === 'Connected' ? 'connected' : 
                  connectionStatus === 'Error' ? 'error' : 'disconnected'
                }`}></div>
                <span>{connectionStatus}</span>
              </div>
              
              {/* Current Time */}
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="medical-spinner"></div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Initializing Patient Monitor</h2>
              <p className="text-gray-600">Connecting to monitoring systems...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="slide-in-up">
              <Dashboard beds={beds} />
            </div>
            
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {beds.map((bed, index) => (
                <div 
                  key={bed.id} 
                  className="slide-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <BedMonitor 
                    bed={bed} 
                    onUpdateCase={updatePatientCase}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      {/* Floating Help Button */}
      <ConditionGuide />
    </div>
  );
}

export default App;
