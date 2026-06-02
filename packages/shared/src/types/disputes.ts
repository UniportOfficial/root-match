export type DisputeStatus = 'reviewing' | 'proposal' | 'waiting' | 'resolved'

export interface DisputeStep {
  title: string
  description: string
  completed: boolean
}

export interface DisputeTimelineItem {
  title: string
  date: string
  description: string
}

export interface DisputeCase {
  id: string
  projectName: string
  counterparty: string
  type: string
  status: DisputeStatus
  statusLabel: string
  requestedAt: string
  nextAction: string
  amount: string
  mediator: string
  progress: number
  updatedAt: string
  requester: string
  respondent: string
  contractDate: string
  dueDate: string
  summary: string
  requestedResolution: string
  evidenceFiles: string[]
  steps: DisputeStep[]
  timeline: DisputeTimelineItem[]
}
