const ConditionInfo = ({ condition }) => {
  const conditionDetails = {
    // General Status
    stable: { 
      name: 'Stable Patient', 
      icon: '🟢', 
      description: 'Normal vital signs within expected ranges',
      severity: 'low'
    },
    post_operative: { 
      name: 'Post-Operative Recovery', 
      icon: '🔵', 
      description: 'Patient recovering from surgical procedure',
      severity: 'medium'
    },
    
    // Respiratory Conditions
    asthma_acute: { 
      name: 'Acute Asthma Exacerbation', 
      icon: '🫁', 
      description: 'Severe bronchospasm with difficulty breathing',
      severity: 'high'
    },
    pneumonia: { 
      name: 'Bacterial Pneumonia', 
      icon: '🦠', 
      description: 'Lung infection causing inflammation and fluid buildup',
      severity: 'high'
    },
    copd_exacerbation: { 
      name: 'COPD Exacerbation', 
      icon: '💨', 
      description: 'Worsening of chronic obstructive pulmonary disease',
      severity: 'high'
    },
    pulmonary_embolism: { 
      name: 'Pulmonary Embolism', 
      icon: '🩸', 
      description: 'Blood clot blocking pulmonary artery',
      severity: 'critical'
    },
    
    // Cardiovascular Conditions
    myocardial_infarction: { 
      name: 'Myocardial Infarction', 
      icon: '❤️', 
      description: 'Heart attack - blocked coronary artery',
      severity: 'critical'
    },
    heart_failure: { 
      name: 'Congestive Heart Failure', 
      icon: '💔', 
      description: 'Heart unable to pump blood effectively',
      severity: 'high'
    },
    atrial_fibrillation: { 
      name: 'Atrial Fibrillation', 
      icon: '⚡', 
      description: 'Irregular heart rhythm with rapid ventricular response',
      severity: 'high'
    },
    hypertensive_crisis: { 
      name: 'Hypertensive Crisis', 
      icon: '📈', 
      description: 'Dangerously high blood pressure requiring immediate treatment',
      severity: 'critical'
    },
    
    // Infectious Diseases
    sepsis: { 
      name: 'Severe Sepsis', 
      icon: '🦠', 
      description: 'Life-threatening response to infection',
      severity: 'critical'
    },
    meningitis: { 
      name: 'Bacterial Meningitis', 
      icon: '🧠', 
      description: 'Infection of protective membranes around brain and spinal cord',
      severity: 'critical'
    },
    influenza_severe: { 
      name: 'Severe Influenza', 
      icon: '🤒', 
      description: 'Severe viral infection with systemic complications',
      severity: 'high'
    },
    fever_unknown: { 
      name: 'Fever of Unknown Origin', 
      icon: '🌡️', 
      description: 'Unexplained fever requiring investigation',
      severity: 'high'
    },
    
    // Neurological Conditions
    stroke_acute: { 
      name: 'Acute Ischemic Stroke', 
      icon: '🧠', 
      description: 'Blocked blood vessel in brain causing tissue death',
      severity: 'critical'
    },
    seizure_status: { 
      name: 'Status Epilepticus', 
      icon: '⚡', 
      description: 'Prolonged seizure activity requiring immediate intervention',
      severity: 'critical'
    },
    head_trauma: { 
      name: 'Severe Head Trauma', 
      icon: '🤕', 
      description: 'Traumatic brain injury with increased intracranial pressure',
      severity: 'critical'
    },
    
    // Metabolic Conditions
    diabetic_ketoacidosis: { 
      name: 'Diabetic Ketoacidosis', 
      icon: '🍯', 
      description: 'Severe diabetes complication with ketone buildup',
      severity: 'critical'
    },
    hypoglycemia_severe: { 
      name: 'Severe Hypoglycemia', 
      icon: '📉', 
      description: 'Dangerously low blood sugar levels',
      severity: 'high'
    },
    thyroid_storm: { 
      name: 'Thyroid Storm', 
      icon: '🦋', 
      description: 'Life-threatening hyperthyroid crisis',
      severity: 'critical'
    },
    hyperkalemia: { 
      name: 'Severe Hyperkalemia', 
      icon: '⚡', 
      description: 'Dangerously high potassium levels affecting heart rhythm',
      severity: 'high'
    },
    
    // Trauma & Emergency
    hemorrhagic_shock: { 
      name: 'Hemorrhagic Shock', 
      icon: '🩸', 
      description: 'Life-threatening blood loss causing circulatory failure',
      severity: 'critical'
    },
    gi_bleeding: { 
      name: 'Upper GI Bleeding', 
      icon: '🔴', 
      description: 'Bleeding in upper gastrointestinal tract',
      severity: 'critical'
    },
    opioid_overdose: { 
      name: 'Opioid Overdose', 
      icon: '💊', 
      description: 'Life-threatening opioid intoxication with respiratory depression',
      severity: 'critical'
    },
    alcohol_withdrawal: { 
      name: 'Severe Alcohol Withdrawal', 
      icon: '🍺', 
      description: 'Dangerous withdrawal syndrome with potential seizures',
      severity: 'high'
    },
    
    // Other Conditions
    acute_kidney_injury: { 
      name: 'Acute Kidney Injury', 
      icon: '🫘', 
      description: 'Sudden loss of kidney function',
      severity: 'high'
    },
    pancreatitis_acute: { 
      name: 'Acute Pancreatitis', 
      icon: '🫄', 
      description: 'Inflammation of pancreas causing severe abdominal pain',
      severity: 'high'
    },
    anemia_severe: { 
      name: 'Severe Anemia', 
      icon: '🩸', 
      description: 'Critically low red blood cell count',
      severity: 'high'
    },
    serotonin_syndrome: { 
      name: 'Serotonin Syndrome', 
      icon: '🧠', 
      description: 'Dangerous reaction to serotonergic medications',
      severity: 'critical'
    },
    chronic_pain_crisis: { 
      name: 'Chronic Pain Crisis', 
      icon: '😣', 
      description: 'Severe exacerbation of chronic pain condition',
      severity: 'high'
    }
  };

  const info = conditionDetails[condition] || { 
    name: 'Unknown Condition', 
    icon: '❓', 
    description: 'Condition not recognized',
    severity: 'medium'
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(info.severity)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{info.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{info.name}</h4>
          <p className="text-xs mt-1 opacity-90">{info.description}</p>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-xs font-medium">Severity:</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 font-medium">
              {info.severity.charAt(0).toUpperCase() + info.severity.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionInfo;