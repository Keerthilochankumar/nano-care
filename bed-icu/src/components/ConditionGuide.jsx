import { useState } from 'react';

const ConditionGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('respiratory');

  const conditionCategories = {
    respiratory: {
      name: 'Respiratory Conditions',
      icon: '🫁',
      conditions: [
        { code: 'asthma_acute', name: 'Acute Asthma', severity: 'Critical' },
        { code: 'pneumonia', name: 'Pneumonia', severity: 'Critical' },
        { code: 'copd_exacerbation', name: 'COPD Exacerbation', severity: 'Critical' },
        { code: 'pulmonary_embolism', name: 'Pulmonary Embolism', severity: 'Emergency' }
      ]
    },
    cardiovascular: {
      name: 'Cardiovascular Conditions',
      icon: '❤️',
      conditions: [
        { code: 'myocardial_infarction', name: 'Heart Attack', severity: 'Emergency' },
        { code: 'heart_failure', name: 'Heart Failure', severity: 'Critical' },
        { code: 'atrial_fibrillation', name: 'Atrial Fibrillation', severity: 'Critical' },
        { code: 'hypertensive_crisis', name: 'Hypertensive Crisis', severity: 'Emergency' }
      ]
    },
    infectious: {
      name: 'Infectious Diseases',
      icon: '🦠',
      conditions: [
        { code: 'sepsis', name: 'Severe Sepsis', severity: 'Emergency' },
        { code: 'meningitis', name: 'Meningitis', severity: 'Emergency' },
        { code: 'influenza_severe', name: 'Severe Flu', severity: 'Critical' },
        { code: 'fever_unknown', name: 'Fever Unknown', severity: 'Critical' }
      ]
    },
    neurological: {
      name: 'Neurological Conditions',
      icon: '🧠',
      conditions: [
        { code: 'stroke_acute', name: 'Acute Stroke', severity: 'Emergency' },
        { code: 'seizure_status', name: 'Status Epilepticus', severity: 'Emergency' },
        { code: 'head_trauma', name: 'Head Trauma', severity: 'Emergency' },
        { code: 'serotonin_syndrome', name: 'Serotonin Syndrome', severity: 'Emergency' }
      ]
    },
    metabolic: {
      name: 'Metabolic Conditions',
      icon: '🍯',
      conditions: [
        { code: 'diabetic_ketoacidosis', name: 'DKA', severity: 'Emergency' },
        { code: 'hypoglycemia_severe', name: 'Severe Hypoglycemia', severity: 'Critical' },
        { code: 'thyroid_storm', name: 'Thyroid Storm', severity: 'Emergency' },
        { code: 'hyperkalemia', name: 'Hyperkalemia', severity: 'Critical' }
      ]
    },
    trauma: {
      name: 'Trauma & Emergency',
      icon: '🚨',
      conditions: [
        { code: 'hemorrhagic_shock', name: 'Hemorrhagic Shock', severity: 'Emergency' },
        { code: 'gi_bleeding', name: 'GI Bleeding', severity: 'Emergency' },
        { code: 'opioid_overdose', name: 'Opioid Overdose', severity: 'Emergency' },
        { code: 'alcohol_withdrawal', name: 'Alcohol Withdrawal', severity: 'Critical' }
      ]
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Emergency': return 'text-red-600 bg-red-50';
      case 'Critical': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Medical Conditions Reference</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-96">
          {/* Category Sidebar */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {Object.entries(conditionCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedCategory === key ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.conditions.length} conditions</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Conditions List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <span className="text-2xl">{conditionCategories[selectedCategory].icon}</span>
                <span>{conditionCategories[selectedCategory].name}</span>
              </h3>
              
              <div className="grid gap-3">
                {conditionCategories[selectedCategory].conditions.map((condition) => (
                  <div key={condition.code} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">{condition.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(condition.severity)}`}>
                        {condition.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Code: {condition.code}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Total: {Object.values(conditionCategories).reduce((sum, cat) => sum + cat.conditions.length, 0)} medical conditions available for simulation
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConditionGuide;