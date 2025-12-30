const Dashboard = ({ beds }) => {
  const getStatusCounts = () => {
    const counts = { stable: 0, critical: 0, emergency: 0, recovering: 0 };
    beds.forEach(bed => {
      // Map all conditions to their severity status
      const severityMap = {
        'stable': 'stable',
        'post_operative': 'recovering',
        'asthma_acute': 'critical',
        'pneumonia': 'critical',
        'copd_exacerbation': 'critical',
        'pulmonary_embolism': 'emergency',
        'myocardial_infarction': 'emergency',
        'heart_failure': 'critical',
        'atrial_fibrillation': 'critical',
        'hypertensive_crisis': 'emergency',
        'sepsis': 'emergency',
        'meningitis': 'emergency',
        'influenza_severe': 'critical',
        'fever_unknown': 'critical',
        'stroke_acute': 'emergency',
        'seizure_status': 'emergency',
        'head_trauma': 'emergency',
        'diabetic_ketoacidosis': 'emergency',
        'hypoglycemia_severe': 'critical',
        'thyroid_storm': 'emergency',
        'hyperkalemia': 'critical',
        'hemorrhagic_shock': 'emergency',
        'gi_bleeding': 'emergency',
        'opioid_overdose': 'emergency',
        'alcohol_withdrawal': 'critical',
        'acute_kidney_injury': 'critical',
        'pancreatitis_acute': 'critical',
        'anemia_severe': 'critical',
        'serotonin_syndrome': 'emergency',
        'chronic_pain_crisis': 'critical'
      };
      
      const status = severityMap[bed.case] || bed.status || 'stable';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const getAverageVitals = () => {
    if (beds.length === 0) return null;
    
    const totals = beds.reduce((acc, bed) => ({
      heartRate: acc.heartRate + bed.vitals.heartRate,
      oxygenSaturation: acc.oxygenSaturation + bed.vitals.oxygenSaturation,
      temperature: acc.temperature + bed.vitals.temperature,
      respiratoryRate: acc.respiratoryRate + bed.vitals.respiratoryRate
    }), { heartRate: 0, oxygenSaturation: 0, temperature: 0, respiratoryRate: 0 });

    return {
      heartRate: (totals.heartRate / beds.length).toFixed(1),
      oxygenSaturation: (totals.oxygenSaturation / beds.length).toFixed(1),
      temperature: (totals.temperature / beds.length).toFixed(1),
      respiratoryRate: (totals.respiratoryRate / beds.length).toFixed(1)
    };
  };

  const getCriticalAlerts = () => {
    return beds.filter(bed => {
      const vitals = bed.vitals;
      return (
        vitals.heartRate > 120 || vitals.heartRate < 50 ||
        vitals.oxygenSaturation < 90 ||
        vitals.temperature > 101 || vitals.temperature < 96 ||
        vitals.respiratoryRate > 24 || vitals.respiratoryRate < 10
      );
    });
  };

  const statusCounts = getStatusCounts();
  const averageVitals = getAverageVitals();
  const criticalAlerts = getCriticalAlerts();

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beds */}
        <div className="medical-card p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Beds</p>
              <p className="text-3xl font-bold text-gray-800">{beds.length}</p>
              <div className="flex items-center mt-2">
                <div className="status-dot stable mr-2"></div>
                <span className="text-xs text-gray-500">Active Monitoring</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className={`medical-card p-6 hover-lift ${criticalAlerts.length > 0 ? 'alert-critical' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Critical Alerts</p>
              <p className={`text-3xl font-bold ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {criticalAlerts.length}
              </p>
              <div className="flex items-center mt-2">
                <div className={`status-dot ${criticalAlerts.length > 0 ? 'emergency' : 'stable'} mr-2`}></div>
                <span className="text-xs text-gray-500">
                  {criticalAlerts.length > 0 ? 'Requires Attention' : 'All Clear'}
                </span>
              </div>
            </div>
            <div className={`w-12 h-12 ${criticalAlerts.length > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Patient Status Distribution */}
        <div className="medical-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Patient Status</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="space-y-3">
            {[
              { status: 'Stable', count: statusCounts.stable, color: '#16a085' },
              { status: 'Recovering', count: statusCounts.recovering, color: '#2980b9' },
              { status: 'Critical', count: statusCounts.critical, color: '#e67e22' },
              { status: 'Emergency', count: statusCounts.emergency, color: '#e74c3c' }
            ].map(({ status, count, color }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm text-gray-700">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-800">{count}</span>
                  <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: color, 
                        width: `${beds.length > 0 ? (count / beds.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Vitals */}
        <div className="medical-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Average Vitals</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          {averageVitals && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Heart Rate</span>
                <span className="text-sm font-semibold text-gray-800">{averageVitals.heartRate} bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">O2 Saturation</span>
                <span className="text-sm font-semibold text-gray-800">{averageVitals.oxygenSaturation}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className="text-sm font-semibold text-gray-800">{averageVitals.temperature}°F</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resp. Rate</span>
                <span className="text-sm font-semibold text-gray-800">{averageVitals.respiratoryRate}/min</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Alerts Section */}
      {criticalAlerts.length > 0 && (
        <div className="medical-card border-l-4 border-red-500 bg-red-50 p-6 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Critical Alerts Requiring Immediate Attention
            </h3>
            <span className="px-3 py-1 bg-red-200 text-red-800 text-sm rounded-full font-medium">
              {criticalAlerts.length} Alert{criticalAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalAlerts.map((bed) => (
              <div key={bed.id} className="bg-white border border-red-200 rounded-lg p-4 hover-lift">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      Bed {bed.id}
                      <div className="status-dot emergency ml-2"></div>
                    </h4>
                    <p className="text-sm text-gray-600">{bed.patientName}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium uppercase">
                    {bed.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {bed.vitals.heartRate > 120 || bed.vitals.heartRate < 50 ? (
                    <div className="text-red-700">HR: {Math.round(bed.vitals.heartRate)} bpm</div>
                  ) : null}
                  {bed.vitals.oxygenSaturation < 90 ? (
                    <div className="text-red-700">O2: {Math.round(bed.vitals.oxygenSaturation)}%</div>
                  ) : null}
                  {bed.vitals.temperature > 101 || bed.vitals.temperature < 96 ? (
                    <div className="text-red-700">Temp: {bed.vitals.temperature.toFixed(1)}°F</div>
                  ) : null}
                  {bed.vitals.respiratoryRate > 24 || bed.vitals.respiratoryRate < 10 ? (
                    <div className="text-red-700">RR: {Math.round(bed.vitals.respiratoryRate)}/min</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;