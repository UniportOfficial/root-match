export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
}

export type ReceivedQuoteRequestStatus = 'new' | 'reviewing' | 'quoted'

export interface ReceivedQuoteRequest {
  id: string
  projectName: string
  clientName: string
  processType: string
  productItem: string
  quantity: string
  budgetRange: string
  desiredDeadline: string
  requestedAt: string
  status: ReceivedQuoteRequestStatus
  description: string
  attachments: Attachment[]
}
