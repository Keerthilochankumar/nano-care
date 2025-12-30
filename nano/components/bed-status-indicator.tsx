'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BedStatusIndicatorProps {
  status?: string
  activeIssues: string[]
  className?: string
}

export function BedStatusIndicator({ status, activeIssues, className }: BedStatusIndicatorProps) {
  // Determine status based on active issues if not provided
  const getStatusFromIssues = (issues: string[]) => {
    if (issues.some(issue => 
      issue.includes('unstable') || 
      issue.includes('hemodynamically') ||
      issue.includes('emergency')
    )) {
      return 'emergency'
    }
    
    if (issues.some(issue => 
      issue.includes('monitoring') || 
      issue.includes('critical') ||
      issue.includes('distress')
    )) {
      return 'critical'
    }
    
    return 'stable'
  }

  const bedStatus = status || getStatusFromIssues(activeIssues)

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'emergency':
        return {
          label: 'Emergency',
          variant: 'destructive' as const,
          className: 'bg-red-600 text-white animate-pulse'
        }
      case 'critical':
        return {
          label: 'Critical',
          variant: 'secondary' as const,
          className: 'bg-orange-500 text-white'
        }
      case 'stable':
        return {
          label: 'Stable',
          variant: 'default' as const,
          className: 'bg-green-600 text-white'
        }
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-500 text-white'
        }
    }
  }

  const config = getStatusConfig(bedStatus)

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}