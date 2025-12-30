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
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

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

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  processed: boolean
  content?: string
}

export default function EnhancedPatientChat({ patient, userId }: PatientChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [ragEnabled, setRagEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatHistory()
    loadUploadedDocuments()
  }, [patient.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history/${patient.id}`)
      if (response.ok) {
        const history = await response.json()
        setMessages(history.messages || [])
      } else {
        // Fallback: use localStorage for chat history if database is not available
        const localHistory = localStorage.getItem(`chat-history-${patient.id}`)
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory)
          setMessages(parsedHistory || [])
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Fallback: use localStorage
      try {
        const localHistory = localStorage.getItem(`chat-history-${patient.id}`)
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory)
          setMessages(parsedHistory || [])
        }
      } catch (localError) {
        console.error('Error loading local chat history:', localError)
      }
    }
  }

  const saveChatHistory = async (newMessages: ChatMessage[]) => {
    try {
      const response = await fetch(`/api/chat-history/${patient.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })
      
      if (!response.ok) {
        // Fallback: save to localStorage if database is not available
        localStorage.setItem(`chat-history-${patient.id}`, JSON.stringify(newMessages))
      }
    } catch (error) {
      console.error('Error saving chat history:', error)
      // Fallback: save to localStorage
      try {
        localStorage.setItem(`chat-history-${patient.id}`, JSON.stringify(newMessages))
      } catch (localError) {
        console.error('Error saving local chat history:', localError)
      }
    }
  }

  const loadUploadedDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/${patient.id}`)
      if (response.ok) {
        const docs = await response.json()
        setUploadedDocs(docs.documents || [])
      } else {
        // Fallback: use localStorage for documents if database is not available
        const localDocs = localStorage.getItem(`documents-${patient.id}`)
        if (localDocs) {
          const parsedDocs = JSON.parse(localDocs)
          setUploadedDocs(parsedDocs || [])
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Fallback: use localStorage
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
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              assistantContent += chunk
              
              // Update the message in real-time as it streams
              const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date().toISOString(),
                ragUsed: ragEnabled,
                sources: []
              }
              
              const finalMessages = [...newMessages, assistantMessage]
              setMessages(finalMessages)
            }
            
            // Save the final chat history
            const finalMessages = [...newMessages, {
              id: (Date.now() + 1).toString(),
              role: 'assistant' as const,
              content: assistantContent,
              timestamp: new Date().toISOString(),
              ragUsed: ragEnabled,
              sources: []
            }]
            await saveChatHistory(finalMessages)
          }
        }
      } catch (error) {
        console.error('Error:', error)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }
        const finalMessages = [...newMessages, errorMessage]
        setMessages(finalMessages)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    for (const file of Array.from(files)) {
      // For now, create a mock document entry that works without database
      const mockDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processed: false
      }

      // Read file content for text files
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        try {
          const text = await file.text()
          mockDoc.content = text
          mockDoc.processed = true
        } catch (error) {
          console.error('Error reading file:', error)
        }
      }

      setUploadedDocs(prev => {
        const newDocs = [...prev, mockDoc]
        // Save to localStorage as fallback
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })

      // Try to upload to server, but don't fail if it doesn't work
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('patientId', patient.id)
        
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          // Update with server ID if successful
          setUploadedDocs(prev => prev.map(doc => 
            doc.id === mockDoc.id ? { ...doc, id: result.id } : doc
          ))
          
          // Start processing
          processDocument(result.id)
        }
      } catch (error) {
        console.error('Server upload failed, using local storage:', error)
        // File is already added to local state, so continue
      }
    }
    
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const processDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/process-document/${docId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setUploadedDocs(prev => 
          prev.map(doc => 
            doc.id === docId ? { ...doc, processed: true } : doc
          )
        )
      }
    } catch (error) {
      console.error('Error processing document:', error)
    }
  }

  const deleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/delete/${docId}`, {
        method: 'DELETE'
      })
      
      if (response.ok || response.status === 404) {
        // Remove from local state regardless of server response
        setUploadedDocs(prev => {
          const newDocs = prev.filter(doc => doc.id !== docId)
          localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
          return newDocs
        })
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      // Still remove from local state
      setUploadedDocs(prev => {
        const newDocs = prev.filter(doc => doc.id !== docId)
        localStorage.setItem(`documents-${patient.id}`, JSON.stringify(newDocs))
        return newDocs
      })
    }
  }

  const clearChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history/${patient.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMessages([])
      } else {
        // Fallback: clear localStorage
        localStorage.removeItem(`chat-history-${patient.id}`)
        setMessages([])
      }
    } catch (error) {
      console.error('Error clearing chat history:', error)
      // Fallback: clear localStorage
      localStorage.removeItem(`chat-history-${patient.id}`)
      setMessages([])
    }
  }

  const latestVitals = patient.current_vitals

  return (
    <div className="min-h-screen bg-gray-50">
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
                    <span className="font-semibold">Clinical Decision Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={ragEnabled ? "default" : "secondary"} className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      RAG {ragEnabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRagEnabled(!ragEnabled)}
                    >
                      <RefreshCw className="h-4 w-4" />
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
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center space-x-2">
                      <History className="h-4 w-4" />
                      <span>History</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} className="flex-1 flex flex-col">
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="mb-2">Ready to assist with clinical decisions</p>
                            <p className="text-sm">Ask about patient status, interpret findings, or discuss treatment options</p>
                          </div>
                        )}
                        
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                                <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                                {message.ragUsed && (
                                  <Badge variant="outline" className="text-xs">
                                    <Database className="h-3 w-3 mr-1" />
                                    RAG
                                  </Badge>
                                )}
                              </div>
                              
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-2 text-xs">
                                  <p className="font-medium">Sources:</p>
                                  {message.sources.map((source, index) => (
                                    <p key={index} className="opacity-70">• {source}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-gray-600">Analyzing patient data...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="p-4 border-t">
                      <form onSubmit={handleSubmit} className="flex space-x-2">
                        <div className="flex-1 relative">
                          <Textarea
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask about patient status, interpret findings, or discuss clinical decisions..."
                            className="min-h-[60px] resize-none pr-12"
                            disabled={isLoading}
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
                        <Button type="submit" disabled={isLoading || !input.trim()}>
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
                        This is decision-support information for trained clinicians and does not replace bedside assessment, multidisciplinary discussion, or local protocols.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="flex-1 m-0">
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Patient Documents</h3>
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
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(doc.size / 1024).toFixed(1)} KB • {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {doc.processed ? (
                                  <Badge variant="default" className="text-xs">
                                    Processed
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Processing...
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {uploadedDocs.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No documents uploaded yet</p>
                              <p className="text-sm">Upload patient documents to enhance AI responses</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="flex-1 m-0">
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Chat History</h3>
                        <Button
                          onClick={clearChatHistory}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear History
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[calc(100%-80px)]">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="border-l-2 border-gray-200 pl-4 py-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                                  {message.role === 'user' ? 'You' : 'AI'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                                </span>
                                {message.ragUsed && (
                                  <Badge variant="outline" className="text-xs">
                                    RAG
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {message.content}
                              </p>
                            </div>
                          ))}
                          
                          {messages.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No chat history yet</p>
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