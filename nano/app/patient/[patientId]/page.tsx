import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PatientChatWrapper from '@/components/patient-chat-wrapper'

interface PatientPageProps {
  params: Promise<{ patientId: string }>
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { userId } = await auth()
  const { patientId } = await params
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Pass the patientId to the wrapper component which will handle WebSocket data
  return <PatientChatWrapper patientId={patientId} userId={userId} />
}