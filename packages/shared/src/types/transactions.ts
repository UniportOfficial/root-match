export type TransactionStatus = 'production' | 'inspection' | 'delayed' | 'completed'
export type TransactionRole = 'client' | 'factory'

export interface TransactionFile {
  name: string
  size: number
  type: string
}

export interface TransactionUpdate {
  title: string
  date: string
  description: string
}

export interface TransactionCase {
  id: string
  projectName: string
  myRole: TransactionRole
  client: string
  factory: string
  amount: string
  dueDate: string
  status: string
  statusKey: TransactionStatus
  progressRate: number
  currentStep: number
  nextAction: string
  updatedAt: string
  deliveryFile: TransactionFile
  inspectionFile: TransactionFile
  updates: TransactionUpdate[]
}
