import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SyncTestPage from '@/components/sync-test-page'

export default async function AdminSyncPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return <SyncTestPage />
}