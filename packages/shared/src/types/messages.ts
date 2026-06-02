import type { Attachment } from './requests.js'

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderCompany: string
  receiverId: string
  receiverName: string
  receiverCompany: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
  attachments?: Attachment[]
}
