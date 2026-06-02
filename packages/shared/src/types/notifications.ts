export type NotificationType = 'message' | 'match' | 'inquiry' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: string
  link?: string
}

export type ActivityLogType = 'view' | 'inquiry' | 'match' | 'message'

export interface ActivityLog {
  id: string
  type: ActivityLogType
  description: string
  targetCompanyId: string
  targetCompanyName: string
  createdAt: string
}

export interface DashboardStats {
  totalViews: number
  totalInquiries: number
  totalMatches: number
  recentMessages: number
}
