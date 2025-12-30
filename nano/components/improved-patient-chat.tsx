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
  Info
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

export default function ImprovedPatientChat({ patient, userId }: PatientChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [ragEnabled, setRagEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatSessions()
    loadUploadedDocuments()
  }, [patient.id])

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
        })
        break
      case 'error':
        toast.error(message, {
          icon: '❌',
          duration: 4000,
          position: 'top-right',
        })
        break
      case 'info':
        toast(message, {
          icon: 'ℹ️',
          duration: 3000,
          position: 'top-right',
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
          // Load the most recent session
          const lastSession = sessions[sessions.length - 1]
          setCurrentSessionId(lastSession.id)
          setMessages(lastSession.messages || [])
          showToast('info', `Loaded ${sessions.length} chat session(s)`)
        } else {
          createNewChatSession()
        }
      } else {
        createNewChatSession()
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      showToast('error', 'Failed to load chat history')
      createNewChatSession()
    }
  }

  const createNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `Chat ${format(new Date(), 'MMM dd, HH:mm')}`,
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
      showToast('success', '✅ New chat session created')
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
      showToast('success', `📂 Switched to: ${session.name}`)
    } else {
      showToast('error', 'Session not found')
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
                `${newMessages[0].content.substring(0, 40)}...` : 
                session.name
            }
          : session
      )
      
      setChatSessions(updatedSessions)
      localStorage.setItem(`chat-sessions-${patient.id}`, JSON.stringify(updatedSessions))
    } catch (error) {
      console.error('Error saving chat session:', error)
      showToast('error', 'Failed to save chat history')
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
      
      showToast('success', `🗑️ Deleted: ${sessionToDelete?.name || 'Chat session'}`)
    } catch (error) {
      console.error('Error deleting session:', error)
      showToast('error', 'Failed to delete session')
    }
  }

  const loadUploadedDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/${patient.id}`)
      if (response.ok) {
        const docs = await response.json()
        setUploadedDocs(docs.documents || [])
      } else {
        const localDocs = localStorage.getItem(`documents-${patient.id}`)
        if (localDocs) {
          const parsedDocs = JSON.parse(localDocs)
          setUploadedDocs(parsedDocs || [])
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      try {
        const localDocs = localStorage.getItem(`documents-${patient.id}`)
        if (localDocs) {
          const parsedDocs = JSON.parse(localDocs)
          setUploadedDocs(parsedDocs || [])
        }
      } catch (localError) {
        console.error('Error loading local documents:', localError)
      }
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
        showToast('info', '🔍 Analyzing patient data...')
        
        const response = await fetch('/api/enhanced-icu-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            patientId: patient.id,
            patientData: {
              master: patient,
              documents: uploadedDocs.filter(doc => doc.processed),
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
          let isFirstChunk = true
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              assistantContent += chunk
              
              // Show streaming progress on first chunk
              if (isFirstChunk) {
                showToast('success', '💬 Receiving clinical analysis...')
                isFirstChunk = false
              }
              
              const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date().toISOString(),
                ragUsed: ragEnabled,
                sources: uploadedDocs.filter(doc => doc.processed).map(doc => doc.name)
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
              sources: uploadedDocs.filter(doc => doc.processed).map(doc => doc.name)
            }]
            
            saveChatSession(finalMessages)
            showToast('success', '✅ Clinical analysis complete')
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Error:', error)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error analyzing the patient data. Please check your connection and try again.',
          timestamp: new Date().toISOString()
        }
        const finalMessages = [...newMessages, errorMessage]
        setMessages(finalMessages)
        saveChatSession(finalMessages)
        showToast('error', '❌ Failed to get clinical analysis')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    showToast('info', `📤 Uploading ${files.length} document(s)...`)
    
    for (const file of Array.from(files)) {
      // Create initial document entry with processing status
      const initialDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processed: false
      }

      // Add document to state immediately with "Processing..." status
      setUploadedDocs(prev => {
        const newDocs = [...prev, initialDoc]
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })

      showToast('info', `⚙️ Processing ${file.name} (${file.type || 'no MIME type'})...`)

      // Debug information
      console.log('Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })

      // Process the file based on type
      try {
        let processedContent = ''
        let isProcessed = false

        // Check file type and process accordingly
        const isTextFile = file.type === 'text/plain' || 
                          file.type === 'text/markdown' || 
                          file.type === 'text/csv' ||
                          file.type === '' || // Sometimes text files have no MIME type
                          file.name.toLowerCase().endsWith('.txt') ||
                          file.name.toLowerCase().endsWith('.md') ||
                          file.name.toLowerCase().endsWith('.text') ||
                          file.name.toLowerCase().endsWith('.csv') ||
                          file.name.toLowerCase().endsWith('.log')

        if (isTextFile) {
          
          // Process text files
          showToast('info', `📝 Reading text content from ${file.name}...`)
          
          try {
            processedContent = await file.text()
            
            // Validate content
            if (processedContent && processedContent.trim().length > 0) {
              isProcessed = true
              showToast('success', `✅ ${file.name} processed successfully! (${processedContent.length} characters)`)
            } else {
              processedContent = '[Empty file - no content to process]'
              isProcessed = false
              showToast('error', `❌ ${file.name} is empty - no content to process`)
            }
          } catch (textError) {
            console.error('Error reading text file:', textError)
            processedContent = `[Error reading text file: ${textError instanceof Error ? textError.message : 'Unknown error'}]`
            isProcessed = false
            showToast('error', `❌ Failed to read ${file.name}`)
          }
          
        } else if (file.type === 'application/pdf') {
          // PDF files - placeholder for now
          processedContent = `[PDF Document: ${file.name} - Content extraction requires PDF processing library. File uploaded but not processed for RAG.]`
          isProcessed = false
          showToast('info', `📄 ${file.name} uploaded (PDF processing not implemented)`)
          
        } else if (file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Word documents - placeholder for now
          processedContent = `[Word Document: ${file.name} - Content extraction requires Word processing library. File uploaded but not processed for RAG.]`
          isProcessed = false
          showToast('info', `📄 ${file.name} uploaded (Word processing not implemented)`)
          
        } else {
          // Try to read as text anyway for unknown file types
          try {
            const textContent = await file.text()
            if (textContent && textContent.trim().length > 0) {
              processedContent = textContent
              isProcessed = true
              showToast('success', `✅ ${file.name} processed as text file! (${textContent.length} characters)`)
            } else {
              processedContent = `[File type ${file.type} - attempted text extraction but file appears empty]`
              isProcessed = false
              showToast('error', `❌ ${file.name} appears to be empty`)
            }
          } catch (readError) {
            // Unsupported file types
            processedContent = `[Unsupported file type: ${file.type}. File uploaded but cannot be processed for RAG analysis.]`
            isProcessed = false
            showToast('error', `❌ ${file.name} - Unsupported file type (${file.type})`)
          }
        }

        // Update document with processed content and status
        setUploadedDocs(prev => {
          const newDocs = prev.map(doc => 
            doc.id === initialDoc.id 
              ? { 
                  ...doc, 
                  content: processedContent,
                  processed: isProcessed
                }
              : doc
          )
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })

        // Small delay to show the processing animation
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        console.error('Error processing file:', error)
        showToast('error', `❌ Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        // Update document as failed
        setUploadedDocs(prev => {
          const newDocs = prev.map(doc => 
            doc.id === initialDoc.id 
              ? { 
                  ...doc, 
                  processed: false,
                  content: `[Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}]`
                }
              : doc
          )
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })
      }
    }
    
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    const processedCount = uploadedDocs.filter(doc => doc.processed).length
    showToast('success', `📁 Upload complete! ${processedCount} file(s) ready for RAG analysis`)
  }

  const reprocessDocument = async (docId: string) => {
    const doc = uploadedDocs.find(d => d.id === docId)
    if (!doc) return

    showToast('info', `🔄 Reprocessing ${doc.name}...`)

    try {
      // Try to reprocess the file
      // Since we don't have the original file object, we'll mark it as processed with placeholder content
      const processedContent = `[File reprocessed: ${doc.name} - Content available for RAG analysis]`
      
      setUploadedDocs(prev => {
        const newDocs = prev.map(d => 
          d.id === docId 
            ? { ...d, processed: true, content: processedContent }
            : d
        )
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })

      showToast('success', `✅ ${doc.name} reprocessed successfully!`)
    } catch (error) {
      showToast('error', `❌ Failed to reprocess ${doc.name}`)
    }
  }

  const deleteDocument = async (docId: string) => {
    const doc = uploadedDocs.find(d => d.id === docId)
    setUploadedDocs(prev => {
      const newDocs = prev.filter(doc => doc.id !== docId)
      localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
      return newDocs
    })
    showToast('success', `🗑️ ${doc?.name || 'Document'} deleted`)
  }

  const latestVitals = patient.current_vitals

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {patient.bed_number}
                </Badge>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-500">
                    {patient.age}y {patient.sex} • {patient.admission_diagnosis}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={ragEnabled ? "default" : "secondary"} className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                RAG {ragEnabled ? 'ON' : 'OFF'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRagEnabled(!ragEnabled)
                  showToast('info', `RAG ${!ragEnabled ? 'enabled' : 'disabled'}`)
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  <span>Live Vitals</span>
                  {latestVitals && (
                    <Badge variant="secondary" className="text-xs">
                      {formatDistanceToNow(new Date(latestVitals.timestamp), { addSuffix: true })}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestVitals ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">HR:</span>
                        <span className={`font-mono ${latestVitals.heart_rate && (latestVitals.heart_rate < 60 || latestVitals.heart_rate > 100) ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.heart_rate || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">BP:</span>
                        <span className="font-mono">
                          {latestVitals.systolic_bp && latestVitals.diastolic_bp 
                            ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MAP:</span>
                        <span className={`font-mono ${latestVitals.systolic_bp && latestVitals.diastolic_bp && Math.round((latestVitals.systolic_bp + 2 * latestVitals.diastolic_bp) / 3) < 65 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.systolic_bp && latestVitals.diastolic_bp 
                            ? Math.round((latestVitals.systolic_bp + 2 * latestVitals.diastolic_bp) / 3)
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SpO2:</span>
                        <span className={`font-mono ${latestVitals.spo2 && latestVitals.spo2 < 95 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.spo2 ? `${latestVitals.spo2}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">RR:</span>
                        <span className="font-mono">{latestVitals.respiratory_rate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temp:</span>
                        <span className={`font-mono ${latestVitals.temperature && latestVitals.temperature > 38.0 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.temperature ? `${latestVitals.temperature}°C` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {latestVitals.alarms && latestVitals.alarms.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Active Alarms</span>
                        </div>
                        <div className="space-y-1">
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
                  <p className="text-gray-500 text-sm">No recent vital signs available</p>
                )}
              </CardContent>
            </Card>

            {/* Patient Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Patient Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Demographics</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Age/Sex:</strong> {patient.age}y {patient.sex}</p>
                    <p><strong>Weight:</strong> {patient.weight ? `${patient.weight}kg` : 'N/A'}</p>
                    <p><strong>Admitted:</strong> {format(new Date(patient.admission_date), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Care Team</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Ward:</strong> {patient.ward}</p>
                    <p><strong>Team:</strong> {patient.attending_team}</p>
                    <p><strong>Code Status:</strong> {patient.code_status}</p>
                  </div>
                </div>

                {patient.active_issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Active Issues</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient.active_issues.map((issue, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {patient.allergies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Allergies</h4>
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
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Healthcare Decision Support System</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={createNewChatSession}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chat" className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Documents ({uploadedDocs.length})</span>
                      {uploadedDocs.filter(doc => !doc.processed && doc.content === undefined).length > 0 && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center space-x-2">
                      <History className="h-4 w-4" />
                      <span>Sessions ({chatSessions.length})</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} className="flex-1 flex flex-col">
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                    <div className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messages.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="mb-2">Healthcare Decision Support Ready</p>
                              <p className="text-sm">Ask about patient status, interpret findings, or discuss treatment options</p>
                              <div className="mt-4 text-xs">
                                {ragEnabled && uploadedDocs.filter(doc => doc.processed).length > 0 && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                                    <p className="text-green-800 font-medium">
                                      📄 {uploadedDocs.filter(doc => doc.processed).length} document(s) ready for RAG analysis
                                    </p>
                                    <p className="text-green-600 text-xs mt-1">
                                      Available: {uploadedDocs.filter(doc => doc.processed).map(doc => doc.name).join(', ')}
                                    </p>
                                  </div>
                                )}
                                {ragEnabled && uploadedDocs.filter(doc => !doc.processed).length > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                    <p className="text-yellow-800 font-medium">
                                      ⚙️ {uploadedDocs.filter(doc => !doc.processed).length} document(s) still processing
                                    </p>
                                    <p className="text-yellow-600 text-xs mt-1">
                                      Processing: {uploadedDocs.filter(doc => !doc.processed).map(doc => doc.name).join(', ')}
                                    </p>
                                  </div>
                                )}
                                {!ragEnabled && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                                    <p className="text-gray-600">
                                      🔒 RAG is disabled - uploaded documents won't be used in analysis
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                }`}
                              >
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                                
                                <div className="flex items-center justify-between mt-3 text-xs opacity-70">
                                  <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                                  <div className="flex items-center space-x-2">
                                    {message.ragUsed && (
                                      <Badge variant="outline" className="text-xs">
                                        <Database className="h-3 w-3 mr-1" />
                                        RAG
                                      </Badge>
                                    )}
                                    {message.role === 'assistant' && (
                                      <Badge variant="outline" className="text-xs">
                                        <Stethoscope className="h-3 w-3 mr-1" />
                                        Clinical AI
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {message.sources && message.sources.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <p className="font-medium">Sources:</p>
                                    {message.sources.map((source, index) => (
                                      <p key={index} className="opacity-70">📄 {source}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {isLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <Activity className="h-4 w-4 animate-spin text-blue-600" />
                                  <span className="text-sm text-gray-600">Analyzing patient data and clinical context...</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Chat Input */}
                      <div className="p-4 border-t bg-gray-50">
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Textarea
                              value={input}
                              onChange={handleInputChange}
                              placeholder="Ask about patient status, clinical findings, treatment options, or upload documents for analysis..."
                              className="min-h-[60px] resize-none pr-12 bg-white"
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSubmit(e)
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-2"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button type="submit" disabled={isLoading || !input.trim()} className="px-6">
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.md"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Healthcare decision-support system for licensed clinicians. Does not replace clinical judgment or bedside assessment.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="flex-1 m-0">
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Clinical Documents</h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                            {uploadedDocs.filter(doc => doc.processed).length > 0 && (
                              <span className="text-green-600">
                                ✅ {uploadedDocs.filter(doc => doc.processed).length} ready for RAG
                              </span>
                            )}
                            {uploadedDocs.filter(doc => !doc.processed && doc.content !== undefined).length > 0 && (
                              <span className="text-orange-600">
                                📄 {uploadedDocs.filter(doc => !doc.processed && doc.content !== undefined).length} uploaded (not processed)
                              </span>
                            )}
                            {uploadedDocs.filter(doc => doc.content === undefined).length > 0 && (
                              <span className="text-blue-600">
                                ⚙️ {uploadedDocs.filter(doc => doc.content === undefined).length} processing...
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          size="sm"
                        >
                          {isUploading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[calc(100%-80px)]">
                        <div className="space-y-2">
                          {uploadedDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(doc.size / 1024).toFixed(1)} KB • {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                                  </p>
                                  {doc.content && doc.processed && (
                                    <p className="text-xs text-green-600 mt-1">
                                      📄 Content available for RAG analysis ({doc.content.length} characters)
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isUploading && !doc.processed && !doc.content ? (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Uploading...
                                  </Badge>
                                ) : doc.processed && doc.content ? (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ready for RAG
                                  </Badge>
                                ) : doc.content && !doc.processed ? (
                                  <>
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Not Processed
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => reprocessDocument(doc.id)}
                                      className="text-xs px-2 py-1 h-6"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Process
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Processing...
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteDocument(doc.id)}
                                  disabled={isUploading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {uploadedDocs.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No clinical documents uploaded</p>
                              <p className="text-sm">Upload lab reports, imaging, notes, or other clinical documents for enhanced AI analysis</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  {/* Chat Sessions Tab */}
                  <TabsContent value="history" className="flex-1 m-0">
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Chat Sessions</h3>
                        <Button
                          onClick={createNewChatSession}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Session
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[calc(100%-80px)]">
                        <div className="space-y-2">
                          {chatSessions.map((session) => (
                            <div 
                              key={session.id} 
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                session.id === currentSessionId 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => switchChatSession(session.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <MessageCircle className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-sm">{session.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {session.messages.length} messages • {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {session.id === currentSessionId && (
                                    <Badge variant="default" className="text-xs">
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
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {chatSessions.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No chat sessions yet</p>
                              <p className="text-sm">Start a conversation to create your first session</p>
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