import { useState } from 'react';

const VitalControls = ({ bed, onUpdateCase, onVitalAdjust }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customVitals, setCustomVitals] = useState({
    heartRate: Math.round(bed.vitals.heartRate),
    oxygenSaturation: Math.round(bed.vitals.oxygenSaturation),
    temperature: bed.vitals.temperature.toFixed(1),
    respiratoryRate: Math.round(bed.vitals.respiratoryRate),
    systolic: Math.round(bed.vitals.bloodPressure.systolic),
    diastolic: Math.round(bed.vitals.bloodPressure.diastolic)
  });

  const handleVitalChange = (vital, value) => {
    const newVitals = { ...customVitals, [vital]: value };
    setCustomVitals(newVitals);
    if (onVitalAdjust) {
      onVitalAdjust(bed.id, vital, value);
    }
  };

  const vitalRanges = {
    heartRate: { min: 40, max: 200, step: 1, unit: 'bpm' },
    oxygenSaturation: { min: 70, max: 100, step: 1, unit: '%' },
    temperature: { min: 95, max: 108, step: 0.1, unit: '°F' },
    respiratoryRate: { min: 8, max: 40, step: 1, unit: '/min' },
    systolic: { min: 60, max: 200, step: 1, unit: 'mmHg' },
    diastolic: { min: 40, max: 120, step: 1, unit: 'mmHg' }
  };

  const getVitalStatus = (vital, value) => {
    const ranges = {
      heartRate: { normal: [60, 100], warning: [50, 120] },
      oxygenSaturation: { normal: [95, 100], warning: [90, 95] },
      temperature: { normal: [97, 99], warning: [96, 101] },
      respiratoryRate: { normal: [12, 20], warning: [10, 24] },
      systolic: { normal: [90, 140], warning: [80, 160] },
      diastolic: { normal: [60, 90], warning: [50, 100] }
    };

    const range = ranges[vital];
    if (!range) return 'normal';

    if (value >= range.normal[0] && value <= range.normal[1]) return 'normal';
    if (value >= range.warning[0] && value <= range.warning[1]) return 'warning';
    return 'critical';
  };

  const getStatusColor = (vital, value) => {
    const status = getVitalStatus(vital, value);
    return status === 'normal' ? 'text-green-600' : 
           status === 'warning' ? 'text-orange-600' : 'text-red-600';
  };

  const getSliderColor = (vital, value) => {
    const status = getVitalStatus(vital, value);
    return status === 'normal' ? 'accent-green-500' : 
           status === 'warning' ? 'accent-orange-500' : 'accent-red-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Patient Controls</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Case Simulation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical Condition Simulation
          </label>
          <select 
            value={bed.case}
            onChange={(e) => onUpdateCase(bed.id, e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {/* General Status */}
            <optgroup label="General Status">
              <option value="stable">🟢 Stable Patient</option>
              <option value="post_operative">🔵 Post-Operative Recovery</option>
            </optgroup>
            
            {/* Respiratory Conditions */}
            <optgroup label="Respiratory Conditions">
              <option value="asthma_acute">🫁 Acute Asthma Exacerbation</option>
              <option value="pneumonia">🦠 Bacterial Pneumonia</option>
              <option value="copd_exacerbation">💨 COPD Exacerbation</option>
              <option value="pulmonary_embolism">🩸 Pulmonary Embolism</option>
            </optgroup>
            
            {/* Cardiovascular Conditions */}
            <optgroup label="Cardiovascular Conditions">
              <option value="myocardial_infarction">❤️ Heart Attack (MI)</option>
              <option value="heart_failure">💔 Heart Failure</option>
              <option value="atrial_fibrillation">⚡ Atrial Fibrillation</option>
              <option value="hypertensive_crisis">📈 Hypertensive Crisis</option>
            </optgroup>
            
            {/* Infectious Diseases */}
            <optgroup label="Infectious Diseases">
              <option value="sepsis">🦠 Severe Sepsis</option>
              <option value="meningitis">🧠 Bacterial Meningitis</option>
              <option value="influenza_severe">🤒 Severe Influenza</option>
              <option value="fever_unknown">🌡️ Fever Unknown Origin</option>
            </optgroup>
            
            {/* Neurological Conditions */}
            <optgroup label="Neurological Conditions">
              <option value="stroke_acute">🧠 Acute Stroke</option>
              <option value="seizure_status">⚡ Status Epilepticus</option>
              <option value="head_trauma">🤕 Severe Head Trauma</option>
            </optgroup>
            
            {/* Metabolic Conditions */}
            <optgroup label="Metabolic Conditions">
              <option value="diabetic_ketoacidosis">🍯 Diabetic Ketoacidosis</option>
              <option value="hypoglycemia_severe">📉 Severe Hypoglycemia</option>
              <option value="thyroid_storm">🦋 Thyroid Storm</option>
              <option value="hyperkalemia">⚡ Severe Hyperkalemia</option>
            </optgroup>
            
            {/* Trauma & Emergency */}
            <optgroup label="Trauma & Emergency">
              <option value="hemorrhagic_shock">🩸 Hemorrhagic Shock</option>
              <option value="gi_bleeding">🔴 GI Bleeding</option>
              <option value="opioid_overdose">💊 Opioid Overdose</option>
              <option value="alcohol_withdrawal">🍺 Alcohol Withdrawal</option>
            </optgroup>
            
            {/* Other Conditions */}
            <optgroup label="Other Conditions">
              <option value="acute_kidney_injury">🫘 Acute Kidney Injury</option>
              <option value="pancreatitis_acute">🫄 Acute Pancreatitis</option>
              <option value="anemia_severe">🩸 Severe Anemia</option>
              <option value="serotonin_syndrome">🧠 Serotonin Syndrome</option>
              <option value="chronic_pain_crisis">😣 Chronic Pain Crisis</option>
            </optgroup>
          </select>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-800">Manual Vital Adjustments</h4>
            
            {/* Heart Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Heart Rate</label>
                <span className={`text-sm font-semibold ${getStatusColor('heartRate', customVitals.heartRate)}`}>
                  {customVitals.heartRate} {vitalRanges.heartRate.unit}
                </span>
              </div>
              <input
                type="range"
                min={vitalRanges.heartRate.min}
                max={vitalRanges.heartRate.max}
                step={vitalRanges.heartRate.step}
                value={customVitals.heartRate}
                onChange={(e) => handleVitalChange('heartRate', parseInt(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('heartRate', customVitals.heartRate)}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{vitalRanges.heartRate.min}</span>
                <span>{vitalRanges.heartRate.max}</span>
              </div>
            </div>

            {/* Oxygen Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Oxygen Saturation</label>
                <span className={`text-sm font-semibold ${getStatusColor('oxygenSaturation', customVitals.oxygenSaturation)}`}>
                  {customVitals.oxygenSaturation} {vitalRanges.oxygenSaturation.unit}
                </span>
              </div>
              <input
                type="range"
                min={vitalRanges.oxygenSaturation.min}
                max={vitalRanges.oxygenSaturation.max}
                step={vitalRanges.oxygenSaturation.step}
                value={customVitals.oxygenSaturation}
                onChange={(e) => handleVitalChange('oxygenSaturation', parseInt(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('oxygenSaturation', customVitals.oxygenSaturation)}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{vitalRanges.oxygenSaturation.min}</span>
                <span>{vitalRanges.oxygenSaturation.max}</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Temperature</label>
                <span className={`text-sm font-semibold ${getStatusColor('temperature', parseFloat(customVitals.temperature))}`}>
                  {customVitals.temperature} {vitalRanges.temperature.unit}
                </span>
              </div>
              <input
                type="range"
                min={vitalRanges.temperature.min}
                max={vitalRanges.temperature.max}
                step={vitalRanges.temperature.step}
                value={customVitals.temperature}
                onChange={(e) => handleVitalChange('temperature', parseFloat(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('temperature', parseFloat(customVitals.temperature))}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{vitalRanges.temperature.min}</span>
                <span>{vitalRanges.temperature.max}</span>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Respiratory Rate</label>
                <span className={`text-sm font-semibold ${getStatusColor('respiratoryRate', customVitals.respiratoryRate)}`}>
                  {customVitals.respiratoryRate} {vitalRanges.respiratoryRate.unit}
                </span>
              </div>
              <input
                type="range"
                min={vitalRanges.respiratoryRate.min}
                max={vitalRanges.respiratoryRate.max}
                step={vitalRanges.respiratoryRate.step}
                value={customVitals.respiratoryRate}
                onChange={(e) => handleVitalChange('respiratoryRate', parseInt(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('respiratoryRate', customVitals.respiratoryRate)}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{vitalRanges.respiratoryRate.min}</span>
                <span>{vitalRanges.respiratoryRate.max}</span>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-700">Blood Pressure</h5>
              
              {/* Systolic */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Systolic</label>
                  <span className={`text-sm font-semibold ${getStatusColor('systolic', customVitals.systolic)}`}>
                    {customVitals.systolic} {vitalRanges.systolic.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={vitalRanges.systolic.min}
                  max={vitalRanges.systolic.max}
                  step={vitalRanges.systolic.step}
                  value={customVitals.systolic}
                  onChange={(e) => handleVitalChange('systolic', parseInt(e.target.value))}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('systolic', customVitals.systolic)}`}
                />
              </div>

              {/* Diastolic */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Diastolic</label>
                  <span className={`text-sm font-semibold ${getStatusColor('diastolic', customVitals.diastolic)}`}>
                    {customVitals.diastolic} {vitalRanges.diastolic.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={vitalRanges.diastolic.min}
                  max={vitalRanges.diastolic.max}
                  step={vitalRanges.diastolic.step}
                  value={customVitals.diastolic}
                  onChange={(e) => handleVitalChange('diastolic', parseInt(e.target.value))}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor('diastolic', customVitals.diastolic)}`}
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setCustomVitals({
                    heartRate: Math.round(bed.vitals.heartRate),
                    oxygenSaturation: Math.round(bed.vitals.oxygenSaturation),
                    temperature: bed.vitals.temperature.toFixed(1),
                    respiratoryRate: Math.round(bed.vitals.respiratoryRate),
                    systolic: Math.round(bed.vitals.bloodPressure.systolic),
                    diastolic: Math.round(bed.vitals.bloodPressure.diastolic)
                  });
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Reset to Current Values
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalControls;