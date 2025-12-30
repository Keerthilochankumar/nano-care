import { useState, useEffect } from 'react';
import VitalChart from './VitalChart';
import VitalControls from './VitalControls';
import ConditionInfo from './ConditionInfo';

const BedMonitor = ({ bed, onUpdateCase }) => {
  const [selectedVital, setSelectedVital] = useState('heartRate');
  const [showCharts, setShowCharts] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [vitalHistory, setVitalHistory] = useState({
    heartRate: [],
    oxygenSaturation: [],
    temperature: [],
    respiratoryRate: [],
    systolic: [],
    diastolic: []
  });

  // Update vital history when new data comes in
  useEffect(() => {
    setVitalHistory(prev => {
      const maxPoints = 20; // Keep last 20 data points
      return {
        heartRate: [...prev.heartRate, bed.vitals.heartRate].slice(-maxPoints),
        oxygenSaturation: [...prev.oxygenSaturation, bed.vitals.oxygenSaturation].slice(-maxPoints),
        temperature: [...prev.temperature, bed.vitals.temperature].slice(-maxPoints),
        respiratoryRate: [...prev.respiratoryRate, bed.vitals.respiratoryRate].slice(-maxPoints),
        systolic: [...prev.systolic, bed.vitals.bloodPressure.systolic].slice(-maxPoints),
        diastolic: [...prev.diastolic, bed.vitals.bloodPressure.diastolic].slice(-maxPoints)
      };
    });
  }, [bed.vitals]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'stable': return 'bg-green-600';
      case 'critical': return 'bg-yellow-600';
      case 'emergency': return 'bg-red-600';
      case 'recovering': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getVitalStatus = (vital, value) => {
    const ranges = {
      heartRate: { normal: [60, 100], warning: [50, 120] },
      oxygenSaturation: { normal: [95, 100], warning: [90, 95] },
      temperature: { normal: [97, 99], warning: [96, 101] },
      respiratoryRate: { normal: [12, 20], warning: [10, 24] }
    };

    const range = ranges[vital];
    if (!range) return 'normal';

    if (value >= range.normal[0] && value <= range.normal[1]) return 'normal';
    if (value >= range.warning[0] && value <= range.warning[1]) return 'warning';
    return 'critical';
  };

  const getVitalColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString();
  };

  const handleCaseChange = (newCase) => {
    onUpdateCase(bed.id, newCase);
  };

  return (
    <div className="space-y-4">
      {/* Main Patient Card */}
      <div className={`medical-card p-4 sm:p-6 hover-lift ${
        bed.status === 'emergency' ? 'alert-critical' : ''
      }`}>
        {/* Status indicator line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          bed.status === 'emergency' ? 'bg-red-500' :
          bed.status === 'critical' ? 'bg-orange-500' :
          bed.status === 'stable' ? 'bg-green-500' :
          'bg-blue-500'
        } ${bed.status === 'emergency' ? 'pulse-gentle' : ''}`}></div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 mt-2 space-y-3 sm:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Bed {bed.id}</h3>
              <div className={`status-dot ${bed.status}`}></div>
            </div>
            <p className="text-gray-700 font-medium">{bed.patientName}</p>
            <p className="text-sm text-gray-500">ID: {bed.patientId}</p>
          </div>
          <div className="text-left sm:text-right space-y-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              bed.status === 'emergency' ? 'bg-red-100 text-red-800' :
              bed.status === 'critical' ? 'bg-orange-100 text-orange-800' :
              bed.status === 'stable' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
            </span>
            <p className="text-xs text-gray-500">
              Admitted: {formatTime(bed.admissionTime)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showCharts 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{showCharts ? 'Hide Charts' : 'Show Charts'}</span>
            </div>
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showControls 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span>{showControls ? 'Hide Controls' : 'Show Controls'}</span>
            </div>
          </button>
        </div>

        {/* Vital Signs Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Heart Rate */}
          <div className={`bg-gray-50 rounded-lg p-4 border ${
            getVitalStatus('heartRate', bed.vitals.heartRate) === 'critical' ? 'border-red-300 bg-red-50' : 
            getVitalStatus('heartRate', bed.vitals.heartRate) === 'warning' ? 'border-orange-300 bg-orange-50' : 
            'border-gray-200'
          } ${getVitalStatus('heartRate', bed.vitals.heartRate) === 'normal' ? 'heartbeat-subtle' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="text-sm text-gray-600">Heart Rate</span>
              </div>
              <span className={`text-xl sm:text-2xl font-bold ${getVitalColor(getVitalStatus('heartRate', bed.vitals.heartRate))}`}>
                {Math.round(bed.vitals.heartRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">bpm</span>
              <div className="progress-bar w-16">
                <div className={`progress-fill ${getVitalStatus('heartRate', bed.vitals.heartRate)}`} 
                     style={{width: `${Math.min(100, (bed.vitals.heartRate / 200) * 100)}%`}}></div>
              </div>
            </div>
          </div>

          {/* Oxygen Saturation */}
          <div className={`bg-gray-50 rounded-lg p-4 border ${
            getVitalStatus('oxygenSaturation', bed.vitals.oxygenSaturation) === 'critical' ? 'border-red-300 bg-red-50' : 
            getVitalStatus('oxygenSaturation', bed.vitals.oxygenSaturation) === 'warning' ? 'border-orange-300 bg-orange-50' : 
            'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm text-gray-600">O2 Sat</span>
              </div>
              <span className={`text-xl sm:text-2xl font-bold ${getVitalColor(getVitalStatus('oxygenSaturation', bed.vitals.oxygenSaturation))}`}>
                {Math.round(bed.vitals.oxygenSaturation)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">%</span>
              <div className="progress-bar w-16">
                <div className={`progress-fill ${getVitalStatus('oxygenSaturation', bed.vitals.oxygenSaturation)}`} 
                     style={{width: `${bed.vitals.oxygenSaturation}%`}}></div>
              </div>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm text-gray-600">Blood Pressure</span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {Math.round(bed.vitals.bloodPressure.systolic)}/{Math.round(bed.vitals.bloodPressure.diastolic)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">mmHg</span>
              <div className="flex space-x-1">
                <div className="progress-bar w-6">
                  <div className="progress-fill normal" style={{width: `${Math.min(100, (bed.vitals.bloodPressure.systolic / 200) * 100)}%`}}></div>
                </div>
                <div className="progress-bar w-6">
                  <div className="progress-fill normal" style={{width: `${Math.min(100, (bed.vitals.bloodPressure.diastolic / 120) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className={`bg-gray-50 rounded-lg p-4 border ${
            getVitalStatus('temperature', bed.vitals.temperature) === 'critical' ? 'border-red-300 bg-red-50' : 
            getVitalStatus('temperature', bed.vitals.temperature) === 'warning' ? 'border-orange-300 bg-orange-50' : 
            'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5l6.25-6.25a2.625 2.625 0 10-3.712-3.712L5 16.094V19.5h3.406z" />
                </svg>
                <span className="text-sm text-gray-600">Temperature</span>
              </div>
              <span className={`text-xl sm:text-2xl font-bold ${getVitalColor(getVitalStatus('temperature', bed.vitals.temperature))}`}>
                {bed.vitals.temperature.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">°F</span>
              <div className="progress-bar w-16">
                <div className={`progress-fill ${getVitalStatus('temperature', bed.vitals.temperature)}`} 
                     style={{width: `${Math.min(100, ((bed.vitals.temperature - 95) / 13) * 100)}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Respiratory Rate - Full Width */}
        <div className={`bg-gray-50 rounded-lg p-4 mb-6 border ${
          getVitalStatus('respiratoryRate', bed.vitals.respiratoryRate) === 'critical' ? 'border-red-300 bg-red-50' : 
          getVitalStatus('respiratoryRate', bed.vitals.respiratoryRate) === 'warning' ? 'border-orange-300 bg-orange-50' : 
          'border-gray-200'
        } ${getVitalStatus('respiratoryRate', bed.vitals.respiratoryRate) === 'normal' ? 'breathing-gentle' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm text-gray-600">Respiratory Rate</span>
            </div>
            <span className={`text-xl sm:text-2xl font-bold ${getVitalColor(getVitalStatus('respiratoryRate', bed.vitals.respiratoryRate))}`}>
              {Math.round(bed.vitals.respiratoryRate)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">breaths/min</span>
            <div className="progress-bar w-20">
              <div className={`progress-fill ${getVitalStatus('respiratoryRate', bed.vitals.respiratoryRate)}`} 
                   style={{width: `${Math.min(100, (bed.vitals.respiratoryRate / 40) * 100)}%`}}></div>
            </div>
          </div>
        </div>

        {/* Condition Information */}
        <div className="mb-4">
          <ConditionInfo condition={bed.case} />
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="connection-indicator connected"></div>
          <span>Last updated: {new Date(bed.vitals.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VitalChart 
            data={vitalHistory.heartRate} 
            vital="heartRate" 
            title="Heart Rate" 
            color="#ef4444" 
            unit="bpm" 
          />
          <VitalChart 
            data={vitalHistory.oxygenSaturation} 
            vital="oxygenSaturation" 
            title="Oxygen Saturation" 
            color="#3b82f6" 
            unit="%" 
          />
          <VitalChart 
            data={vitalHistory.temperature} 
            vital="temperature" 
            title="Temperature" 
            color="#f97316" 
            unit="°F" 
          />
          <VitalChart 
            data={vitalHistory.respiratoryRate} 
            vital="respiratoryRate" 
            title="Respiratory Rate" 
            color="#06b6d4" 
            unit="/min" 
          />
        </div>
      )}

      {/* Controls Section */}
      {showControls && (
        <VitalControls 
          bed={bed} 
          onUpdateCase={onUpdateCase}
        />
      )}
    </div>
  );
};

export default BedMonitor;