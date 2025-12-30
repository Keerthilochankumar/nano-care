'use client'

import { useState, useEffect, useRef } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  ArrowLeft, 
  Send, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  Clock,
  User,
  Stethoscope,
  Upload,
  X,
  MessageSquare,
  History,
  Database,
  Paperclip,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Menu,
  ChevronDown,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
  Brain,
  FileCheck,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import toast, { Toaster } from 'react-hot-toast'

interface PatientChatProps {
  patient: {
    id: string
    bed_number: string
    name: string
    age: number
    sex: 'M' | 'F' | 'Other'
    weight?: number
    admission_date: string
    admission_diagnosis: string
    ward: string
    attending_team: string
    problem_list: string[]
    comorbidities: string[]
    active_issues: string[]
    medications: string[]
    allergies: string[]
    code_status: string
    important_events: string[]
    created_at: string
    updated_at: string
    current_vitals?: {
      heart_rate: number
      systolic_bp: number
      diastolic_bp: number
      spo2: number
      temperature: number
      respiratory_rate: number
      timestamp: string
      status: string
      alarms: string[]
    }
  }
  userId: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  ragUsed?: boolean
  sources?: string[]
}

interface ChatSession {
  id: string
  name: string
  created: string
  messages: ChatMessage[]
  lastActivity: string
}

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  processed: boolean
  content?: string
}

export default function ModernPatientChat({ patient, userId }: PatientChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [ragEnabled, setRagEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatSessions()
    loadUploadedDocuments()
  }, [patient.id])

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    switch (type) {
      case 'success':
        toast.success(message, {
          icon: '✅',
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#3B82F6',
            color: 'white',
            borderRadius: '12px',
            padding: '16px',
          }
        })
        break
      case 'error':
        toast.error(message, {
          icon: '❌',
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: 'white',
            borderRadius: '12px',
            padding: '16px',
          }
        })
        break
      case 'info':
        toast(message, {
          icon: 'ℹ️',
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#6366F1',
            color: 'white',
            borderRadius: '12px',
            padding: '16px',
          }
        })
        break
    }
  }

  const loadChatSessions = async () => {
    try {
      const localSessions = localStorage.getItem(`chat-sessions-${patient.id}`)
      if (localSessions) {
        const sessions = JSON.parse(localSessions)
        setChatSessions(sessions)
        
        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1]
          setCurrentSessionId(lastSession.id)
          setMessages(lastSession.messages || [])
        } else {
          createNewChatSession()
        }
      } else {
        createNewChatSession()
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      createNewChatSession()
    }
  }

  const createNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `New Chat ${format(new Date(), 'HH:mm')}`,
      created: new Date().toISOString(),
      messages: [],
      lastActivity: new Date().toISOString()
    }
    
    const updatedSessions = [...chatSessions, newSession]
    setChatSessions(updatedSessions)
    setCurrentSessionId(newSession.id)
    setMessages([])
    
    try {
      localStorage.setItem(`chat-sessions-${patient.id}`, JSON.stringify(updatedSessions))
      showToast('success', '🆕 New chat session created')
    } catch (error) {
      console.error('Error saving new session:', error)
      showToast('error', 'Failed to create new session')
    }
  }

  const switchChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages || [])
      showToast('success', `📂 ${session.name}`)
    }
  }

  const saveChatSession = (newMessages: ChatMessage[]) => {
    try {
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: newMessages, 
              lastActivity: new Date().toISOString(),
              name: newMessages.length > 0 && newMessages[0].role === 'user' ? 
                newMessages[0].content.substring(0, 30) + '...' : 
                session.name
            }
          : session
      )
      
      setChatSessions(updatedSessions)
      localStorage.setItem(`chat-sessions-${patient.id}`, JSON.stringify(updatedSessions))
    } catch (error) {
      console.error('Error saving chat session:', error)
    }
  }

  const deleteChatSession = (sessionId: string) => {
    try {
      const sessionToDelete = chatSessions.find(s => s.id === sessionId)
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId)
      setChatSessions(updatedSessions)
      localStorage.setItem(`chat-sessions-${patient.id}`, JSON.stringify(updatedSessions))
      
      if (sessionId === currentSessionId) {
        if (updatedSessions.length > 0) {
          const lastSession = updatedSessions[updatedSessions.length - 1]
          setCurrentSessionId(lastSession.id)
          setMessages(lastSession.messages || [])
        } else {
          createNewChatSession()
        }
      }
      
      showToast('success', `🗑️ Deleted session`)
    } catch (error) {
      console.error('Error deleting session:', error)
      showToast('error', 'Failed to delete session')
    }
  }

  const loadUploadedDocuments = async () => {
    try {
      const localDocs = localStorage.getItem(`documents-${patient.id}`)
      if (localDocs) {
        const parsedDocs = JSON.parse(localDocs)
        setUploadedDocs(parsedDocs || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      }
      
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setInput('')
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/enhanced-icu-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            patientId: patient.id,
            patientData: {
              master: patient,
              documents: ragEnabled ? uploadedDocs.filter(doc => doc.processed) : [],
              vitals: patient.current_vitals ? [patient.current_vitals] : []
            },
            ragEnabled,
            userId
          })
        })
        
        if (response.ok) {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let assistantContent = ''
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              assistantContent += chunk
              
              const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: assistantContent,
                timestamp: new Date().toISOString(),
                ragUsed: ragEnabled,
                sources: ragEnabled ? uploadedDocs.filter(doc => doc.processed).map(doc => doc.name) : []
              }
              
              const finalMessages = [...newMessages, assistantMessage]
              setMessages(finalMessages)
            }
            
            const finalMessages = [...newMessages, {
              id: (Date.now() + 1).toString(),
              role: 'assistant' as const,
              content: assistantContent,
              timestamp: new Date().toISOString(),
              ragUsed: ragEnabled,
              sources: ragEnabled ? uploadedDocs.filter(doc => doc.processed).map(doc => doc.name) : []
            }]
            
            saveChatSession(finalMessages)
            showToast('success', '✅ Analysis complete')
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('Error:', error)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }
        const finalMessages = [...newMessages, errorMessage]
        setMessages(finalMessages)
        saveChatSession(finalMessages)
        showToast('error', '❌ Analysis failed')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    showToast('info', `📤 Processing ${files.length} file(s)...`)
    
    for (const file of Array.from(files)) {
      const initialDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processed: false
      }

      // Add document to state immediately
      setUploadedDocs(prev => {
        const newDocs = [...prev, initialDoc]
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })

      try {
        // Use the document processing API for all file types
        const formData = new FormData()
        formData.append('file', file)
        formData.append('patientId', patient.id)

        showToast('info', `🔄 Extracting content from ${file.name}...`)

        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success && result.content && result.content.length > 0) {
          // Successfully extracted content
          setUploadedDocs(prev => {
            const newDocs = prev.map(doc => 
              doc.id === initialDoc.id 
                ? { ...doc, content: result.content, processed: true }
                : doc
            )
            localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
            return newDocs
          })
          
          showToast('success', `✅ ${file.name} processed successfully (${result.length} characters)`)
        } else {
          // Use the API response content (which includes helpful instructions for PDFs)
          setUploadedDocs(prev => {
            const newDocs = prev.map(doc => 
              doc.id === initialDoc.id 
                ? { 
                    ...doc, 
                    content: result.content || `[${file.name}]\nProcessing failed: ${result.message || 'Unknown error'}`, 
                    processed: false 
                  }
                : doc
            )
            localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
            return newDocs
          })
          
          // Show appropriate message based on file type
          if (file.name.toLowerCase().endsWith('.pdf')) {
            showToast('info', `📄 ${file.name} uploaded - conversion instructions provided`)
          } else {
            showToast('error', `❌ Failed to process ${file.name}: ${result.message || 'Unknown error'}`)
          }
        }

      } catch (error) {
        console.error('Error processing file:', error)
        
        // Mark as failed processing
        setUploadedDocs(prev => {
          const newDocs = prev.map(doc => 
            doc.id === initialDoc.id 
              ? { 
                  ...doc, 
                  content: `[${file.name}]\nProcessing error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try uploading the file again or convert it to a text format.`, 
                  processed: false 
                }
              : doc
          )
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })
        
        showToast('error', `❌ Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Show final summary
    setTimeout(() => {
      const processedCount = uploadedDocs.filter(doc => doc.processed).length
      if (processedCount > 0) {
        showToast('success', `🎉 ${processedCount} document(s) ready for RAG analysis!`)
      }
    }, 1000)
  }

  const deleteDocument = async (docId: string) => {
    const doc = uploadedDocs.find(d => d.id === docId)
    setUploadedDocs(prev => {
      const newDocs = prev.filter(doc => doc.id !== docId)
      localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
      return newDocs
    })
    showToast('success', `🗑️ Removed ${doc?.name}`)
  }

  const reprocessDocument = async (docId: string) => {
    const doc = uploadedDocs.find(d => d.id === docId)
    if (!doc) return

    showToast('info', `🔄 Reprocessing ${doc.name}...`)
    
    // Mark document as processing
    setUploadedDocs(prev => {
      const newDocs = prev.map(d => 
        d.id === docId 
          ? { ...d, processed: false, content: undefined }
          : d
      )
      localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
      return newDocs
    })

    try {
      // Create a blob from the original file data (we'll need to simulate this)
      // For now, we'll create a simple reprocess request
      const response = await fetch('/api/reprocess-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          documentName: doc.name,
          patientId: patient.id
        })
      })

      const result = await response.json()

      if (result.success && result.content && result.content.length > 0) {
        // Successfully reprocessed
        setUploadedDocs(prev => {
          const newDocs = prev.map(d => 
            d.id === docId 
              ? { ...d, content: result.content, processed: true }
              : d
          )
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })
        
        showToast('success', `✅ ${doc.name} reprocessed successfully!`)
      } else {
        // Reprocessing failed
        setUploadedDocs(prev => {
          const newDocs = prev.map(d => 
            d.id === docId 
              ? { 
                  ...d, 
                  content: result.content || `[${doc.name}]\nReprocessing failed: ${result.message || 'Unknown error'}`, 
                  processed: false 
                }
              : d
          )
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })
        
        showToast('error', `❌ Failed to reprocess ${doc.name}: ${result.message || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Error reprocessing document:', error)
      
      setUploadedDocs(prev => {
        const newDocs = prev.map(d => 
          d.id === docId 
            ? { 
                ...d, 
                content: `[${doc.name}]\nReprocessing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                processed: false 
              }
            : d
        )
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })
      
      showToast('error', `❌ Error reprocessing ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const viewDocumentContent = (doc: UploadedDocument) => {
    if (doc.content) {
      // Create a modal-like alert to show the content
      const content = doc.content.length > 1000 
        ? doc.content.substring(0, 1000) + '\n\n... (content truncated)'
        : doc.content
      
      alert(`${doc.name}\n\n${content}`)
    }
  }

  const createTestDocument = () => {
    const testDoc: UploadedDocument = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'sample-cardiology-report.txt',
      type: 'text/plain',
      size: 2048,
      uploadedAt: new Date().toISOString(),
      processed: true,
      content: `OMC CARDIOLOGY REPORT

PATIENT: ${patient.name}
DOB: 1979-12-15
MRN: ${patient.id}
DATE: ${new Date().toLocaleDateString()}

CLINICAL INDICATION:
Acute chest pain with dyspnea, rule out myocardial infarction

ELECTROCARDIOGRAM FINDINGS:
- Sinus tachycardia at ${patient.current_vitals?.heart_rate || 104} bpm
- ST-segment depression in leads V4-V6 (2mm)
- T-wave inversions in leads II, III, aVF
- No evidence of acute ST-elevation MI
- Prolonged QTc interval (460ms)

ECHOCARDIOGRAM RESULTS:
- Left ventricular ejection fraction: 45% (mildly reduced)
- Regional wall motion abnormalities in inferior wall
- Mild mitral regurgitation
- Normal right heart function
- No pericardial effusion

CARDIAC BIOMARKERS:
- Troponin I: 2.4 ng/mL (elevated, normal <0.04)
- CK-MB: 15.2 ng/mL (elevated, normal <6.3)
- BNP: 450 pg/mL (elevated, normal <100)

CURRENT VITALS:
- Heart Rate: ${patient.current_vitals?.heart_rate || 'N/A'} bpm
- Blood Pressure: ${patient.current_vitals?.systolic_bp || 'N/A'}/${patient.current_vitals?.diastolic_bp || 'N/A'} mmHg
- SpO2: ${patient.current_vitals?.spo2 || 'N/A'}%
- Temperature: ${patient.current_vitals?.temperature || 'N/A'}°C
- Status: ${patient.current_vitals?.status?.toUpperCase() || 'STABLE'}

ASSESSMENT:
1. Non-ST elevation myocardial infarction (NSTEMI)
2. Acute coronary syndrome
3. Mild heart failure with reduced ejection fraction
4. Current clinical status: ${patient.current_vitals?.status || 'stable'}

RECOMMENDATIONS:
1. Immediate cardiology consultation
2. Dual antiplatelet therapy (aspirin + clopidogrel)
3. Continuous cardiac monitoring
4. Serial troponin levels every 6 hours
5. Consider cardiac catheterization within 24 hours

CURRENT MEDICATIONS:
${patient.medications.map(med => `- ${med}`).join('\n')}

ALLERGIES: ${patient.allergies.length > 0 ? patient.allergies.join(', ') : 'NKDA'}

Dr. Sarah Johnson, MD
Interventional Cardiology
OMC Heart Center`
    }

    setUploadedDocs(prev => {
      const newDocs = [...prev, testDoc]
      localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
      return newDocs
    })

    showToast('success', '📄 Sample cardiology report created and ready for RAG!')
  }

  const latestVitals = patient.current_vitals
  const processedDocs = uploadedDocs.filter(doc => doc.processed)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <Toaster />
      
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Badge variant="outline" className="font-mono text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    {patient.bed_number}
                  </Badge>
                  {latestVitals?.status === 'critical' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-600">
                    {patient.age}y {patient.sex} • {patient.admission_diagnosis}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Enhanced Sidebar */}
          <div className={`lg:col-span-1 space-y-4 transition-all duration-300 ${sidebarCollapsed ? 'hidden lg:block' : ''}`}>
            {/* Live Vitals Card */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Vitals</span>
                  </div>
                  {latestVitals && (
                    <Badge variant="secondary" className="text-xs">
                      {formatDistanceToNow(new Date(latestVitals.timestamp), { addSuffix: true })}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {latestVitals ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { label: 'HR', value: latestVitals.heart_rate, unit: '', critical: latestVitals.heart_rate < 60 || latestVitals.heart_rate > 100 },
                        { label: 'BP', value: `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}`, unit: '', critical: false },
                        { label: 'SpO2', value: latestVitals.spo2, unit: '%', critical: latestVitals.spo2 < 95 },
                        { label: 'Temp', value: latestVitals.temperature, unit: '°C', critical: latestVitals.temperature > 38.0 },
                      ].map((vital, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs">{vital.label}</span>
                            <span className={`font-mono font-medium ${vital.critical ? 'text-red-600' : 'text-gray-900'}`}>
                              {vital.value}{vital.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {latestVitals.alarms && latestVitals.alarms.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Active Alarms</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {latestVitals.alarms.map((alarm, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {alarm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent vitals</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Summary Card */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>Patient Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age/Sex:</span>
                    <span className="font-medium">{patient.age}y {patient.sex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{patient.weight ? `${patient.weight}kg` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team:</span>
                    <span className="font-medium text-xs">{patient.attending_team}</span>
                  </div>
                </div>

                {patient.active_issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-xs text-gray-700 mb-2">Active Issues</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient.active_issues.slice(0, 3).map((issue, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                      {patient.active_issues.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{patient.active_issues.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {patient.allergies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-xs text-gray-700 mb-2">Allergies</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RAG Status Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span>AI Enhancement</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRagEnabled(!ragEnabled)}
                    className="h-6 px-2"
                  >
                    <div className={`w-8 h-4 rounded-full transition-colors ${ragEnabled ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${ragEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                    </div>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={ragEnabled ? "default" : "secondary"} className="text-xs">
                      {ragEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium">{uploadedDocs.length} total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ready for RAG:</span>
                    <span className="font-medium text-green-600">{processedDocs.length}</span>
                  </div>
                  {uploadedDocs.filter(doc => !doc.processed).length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Processing:</span>
                      <span className="font-medium text-orange-600">{uploadedDocs.filter(doc => !doc.processed).length}</span>
                    </div>
                  )}
                  {ragEnabled && processedDocs.length > 0 && (
                    <div className="bg-blue-100 rounded-lg p-2 mt-2">
                      <p className="text-blue-800 text-xs font-medium">
                        🧠 AI enhanced with {processedDocs.length} document(s)
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        {processedDocs.map(doc => doc.name).slice(0, 2).join(', ')}
                        {processedDocs.length > 2 && ` +${processedDocs.length - 2} more`}
                      </p>
                    </div>
                  )}
                  {ragEnabled && processedDocs.length === 0 && uploadedDocs.length > 0 && (
                    <div className="bg-orange-100 rounded-lg p-2 mt-2">
                      <p className="text-orange-800 text-xs font-medium">
                        ⚠️ No documents ready for RAG
                      </p>
                      <p className="text-orange-600 text-xs mt-1">
                        Upload and process documents to enhance AI responses
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Chat Interface */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Healthcare AI Assistant</h3>
                      <p className="text-sm text-gray-600">Clinical decision support system</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={createNewChatSession}
                      variant="outline"
                      size="sm"
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
                    <TabsTrigger value="chat" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Documents</span>
                      <Badge variant="secondary" className="text-xs">{uploadedDocs.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <History className="h-4 w-4" />
                      <span className="hidden sm:inline">Sessions</span>
                      <Badge variant="secondary" className="text-xs">{chatSessions.length}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} className="flex-1 flex flex-col">
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                    <div className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                          {messages.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Stethoscope className="h-8 w-8 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare AI Ready</h3>
                              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Ask about patient status, interpret findings, or discuss treatment options with our clinical AI assistant.
                              </p>
                              
                              {ragEnabled && processedDocs.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <FileCheck className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-800">Enhanced with Documents</span>
                                  </div>
                                  <p className="text-green-700 text-sm">
                                    {processedDocs.length} document(s) ready for analysis
                                  </p>
                                </div>
                              )}
                              
                              {!ragEnabled && (
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <AlertCircle className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-800">RAG Disabled</span>
                                  </div>
                                  <p className="text-gray-700 text-sm">
                                    AI will analyze only patient data and vital signs
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {messages.map((message, index) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-lg ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ml-12'
                                    : 'bg-white border border-gray-100 text-gray-900 mr-12'
                                }`}
                              >
                                {message.role === 'assistant' && (
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                      <Brain className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">Healthcare AI</span>
                                    {message.ragUsed && message.sources && message.sources.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        <Zap className="h-3 w-3 mr-1 text-blue-500" />
                                        Enhanced
                                      </Badge>
                                    )}
                                    {!message.ragUsed && (
                                      <Badge variant="outline" className="text-xs bg-gray-50">
                                        <Activity className="h-3 w-3 mr-1 text-gray-500" />
                                        Base Analysis
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                                
                                <div className="flex items-center justify-between mt-4 text-xs opacity-70">
                                  <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                                </div>
                                
                                {message.sources && message.sources.length > 0 && message.ragUsed && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="font-medium text-xs text-blue-800 mb-1">Sources:</p>
                                    {message.sources.map((source, index) => (
                                      <p key={index} className="text-xs text-blue-700">📄 {source}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {isLoading && (
                            <div className="flex justify-start animate-in slide-in-from-bottom-2">
                              <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-lg mr-12">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Brain className="h-3 w-3 text-white" />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-gray-600">Analyzing clinical data...</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Modern Chat Input */}
                      <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="relative">
                            <Textarea
                              ref={textareaRef}
                              value={input}
                              onChange={handleInputChange}
                              placeholder="Ask about patient status, clinical findings, treatment options..."
                              className="min-h-[60px] max-h-[120px] resize-none pr-24 bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl shadow-sm"
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSubmit(e)
                                }
                              }}
                            />
                            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={isLoading || !input.trim()}
                                className="h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.md,.csv,.log,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          
                          <p className="text-xs text-gray-500 text-center">
                            Healthcare decision-support for licensed clinicians • Does not replace clinical judgment
                          </p>
                        </form>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="flex-1 m-0">
                    <div className="p-6 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-gray-900">Clinical Documents</h3>
                          <p className="text-sm text-gray-600">Upload documents to enhance AI analysis</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={createTestDocument}
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Add Test Doc
                          </Button>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Files
                          </Button>
                        </div>
                      </div>
                      
                      <ScrollArea className="h-[calc(100%-120px)]">
                        <div className="space-y-3">
                          {uploadedDocs.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => viewDocumentContent(doc)}>
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(doc.size / 1024).toFixed(1)} KB • {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                                    </p>
                                    {doc.content && doc.processed && (
                                      <p className="text-xs text-green-600 mt-1">
                                        ✅ Ready for AI analysis ({doc.content.length} characters)
                                      </p>
                                    )}
                                    {doc.content && !doc.processed && doc.content.includes('PDF Document:') && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        📄 PDF uploaded - click to view conversion instructions
                                      </p>
                                    )}
                                    {doc.content && !doc.processed && doc.content.includes('Word Document:') && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        📄 Word document - manual conversion needed
                                      </p>
                                    )}
                                    {doc.content && !doc.processed && doc.content.includes('Processing Error:') && (
                                      <p className="text-xs text-red-600 mt-1">
                                        ❌ Processing error occurred - try re-uploading
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {doc.processed ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Ready for RAG
                                    </Badge>
                                  ) : doc.content && doc.content.includes('PDF Document:') ? (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                      <Eye className="h-3 w-3 mr-1" />
                                      Click to View Instructions
                                    </Badge>
                                  ) : doc.content && doc.content.includes('Word Document:') ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      DOC - Conversion Needed
                                    </Badge>
                                  ) : doc.content && doc.content.includes('Processing Error:') ? (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Processing Failed
                                    </Badge>
                                  ) : doc.content && (doc.content.includes('Processing failed:') || doc.content.includes('Reprocessing failed:') || doc.content.includes('Automatic PDF processing failed')) ? (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Processing Failed
                                    </Badge>
                                  ) : doc.content ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Manual Action Needed
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Processing...
                                    </Badge>
                                  )}
                                  
                                  {/* Show reprocess button for failed documents */}
                                  {doc.content && (doc.content.includes('Processing failed:') || doc.content.includes('Reprocessing failed:') || doc.content.includes('Automatic PDF processing failed') || doc.content.includes('Processing Error:')) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => reprocessDocument(doc.id)}
                                      className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Retry
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDocument(doc.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {uploadedDocs.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-blue-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
                              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Upload clinical documents, lab reports, or notes to enhance AI analysis with relevant context.
                              </p>
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Your First Document
                              </Button>
                              <p className="text-xs text-gray-500 mt-4">
                                <strong>Supported formats:</strong> Text files (.txt, .md, .csv), Word documents (.docx)
                                <br />
                                <strong>For PDFs:</strong> Convert to text format for best results
                                <br />
                                <a 
                                  href="/sample-cardio-report.txt" 
                                  download="sample-cardio-report.txt"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  📄 Download sample cardiology report
                                </a>
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  {/* Chat Sessions Tab */}
                  <TabsContent value="history" className="flex-1 m-0">
                    <div className="p-6 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-gray-900">Chat Sessions</h3>
                          <p className="text-sm text-gray-600">Manage your conversation history</p>
                        </div>
                        <Button
                          onClick={createNewChatSession}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Session
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[calc(100%-120px)]">
                        <div className="space-y-3">
                          {chatSessions.map((session) => (
                            <div 
                              key={session.id} 
                              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                session.id === currentSessionId 
                                  ? 'border-blue-200 bg-blue-50 shadow-sm' 
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                              onClick={() => switchChatSession(session.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    session.id === currentSessionId 
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                                  }`}>
                                    <MessageCircle className={`h-5 w-5 ${
                                      session.id === currentSessionId ? 'text-white' : 'text-gray-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{session.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {session.messages.length} messages • {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {session.id === currentSessionId && (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      Active
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteChatSession(session.id)
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {chatSessions.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-blue-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Start a conversation to create your first chat session. All your conversations will be saved here.
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}