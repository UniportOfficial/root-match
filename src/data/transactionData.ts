export type TransactionStatus = 'production' | 'inspection' | 'delayed' | 'completed'

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

export const transactionStatusStyles: Record<TransactionStatus, string> = {
  production: 'bg-blue-50 text-blue-700 ring-blue-100',
  inspection: 'bg-amber-50 text-amber-700 ring-amber-100',
  delayed: 'bg-red-50 text-red-700 ring-red-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

export const transactionSteps = [
  { title: '전자 계약서 생성', description: '계약 조건 확정' },
  { title: '전자서명', description: '양측 서명 완료' },
  { title: '에스크로 결제', description: '대금 보호 적용' },
  { title: '작업 진행', description: '제작 및 상태 업데이트' },
  { title: '납품 검수', description: '납품 자료 확인' },
  { title: '거래 완료 및 리뷰', description: '정산과 후기 작성' }
]

export const transactionCases: TransactionCase[] = [
  {
    id: 'TXN-2026-018',
    projectName: '알루미늄 하우징 시제품 제작',
    client: '루트테크',
    factory: '문래정밀가공',
    amount: '4,200,000원',
    dueDate: '2026.05.20',
    status: '납품 검수 대기',
    statusKey: 'inspection',
    progressRate: 100,
    currentStep: 5,
    nextAction: '납품 자료 확인 후 검수 승인 또는 중재 신청',
    updatedAt: '2026.05.18 16:30',
    deliveryFile: { name: 'delivery_photo_package.zip', size: 12800000, type: 'application/zip' },
    inspectionFile: { name: 'final_inspection_report.pdf', size: 3100000, type: 'application/pdf' },
    updates: [
      { title: '소재 입고 완료', date: '2026.05.03', description: '6061 알루미늄 소재 입고 및 수량 확인 완료' },
      { title: 'CNC 1차 가공 완료', date: '2026.05.09', description: '하우징 외형 가공 및 주요 공차 측정 완료' },
      { title: '표면처리 완료', date: '2026.05.15', description: '블랙 아노다이징 처리 및 외관 검사 완료' },
      { title: '납품 등록 완료', date: '2026.05.18', description: '납품 사진과 검사 결과서가 등록되었습니다.' }
    ]
  },
  {
    id: 'TXN-2026-017',
    projectName: '스테인리스 브라켓 양산',
    client: '루트테크',
    factory: '서울메탈웍스',
    amount: '9,800,000원',
    dueDate: '2026.06.02',
    status: '작업 진행 중',
    statusKey: 'production',
    progressRate: 62,
    currentStep: 4,
    nextAction: '2차 가공 완료 후 중간 검사 결과 업로드',
    updatedAt: '2026.05.27 11:10',
    deliveryFile: { name: 'partial_delivery_plan.pdf', size: 940000, type: 'application/pdf' },
    inspectionFile: { name: 'midterm_inspection.xlsx', size: 680000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    updates: [
      { title: '계약 및 결제 완료', date: '2026.05.16', description: '에스크로 결제와 전자서명이 완료되었습니다.' },
      { title: '소재 절단 완료', date: '2026.05.20', description: '스테인리스 원소재 절단 및 가공 준비 완료' },
      { title: '1차 용접 완료', date: '2026.05.26', description: '브라켓 본체 용접과 치수 확인 진행' }
    ]
  },
  {
    id: 'TXN-2026-015',
    projectName: 'ABS 사출 케이스 금형 제작',
    client: '루트테크',
    factory: '동부금형',
    amount: '13,500,000원',
    dueDate: '2026.05.28',
    status: '일정 지연 주의',
    statusKey: 'delayed',
    progressRate: 48,
    currentStep: 4,
    nextAction: '설계 수정 범위와 추가 일정 확인',
    updatedAt: '2026.05.25 18:40',
    deliveryFile: { name: 'mold_revision_preview.zip', size: 5200000, type: 'application/zip' },
    inspectionFile: { name: 'tooling_checklist.pdf', size: 1100000, type: 'application/pdf' },
    updates: [
      { title: '금형 설계 착수', date: '2026.05.08', description: '초기 설계와 게이트 위치 검토 시작' },
      { title: '설계 수정 요청', date: '2026.05.19', description: '조립부 간섭 이슈로 설계 수정 요청' },
      { title: '일정 재산정', date: '2026.05.25', description: '추가 가공 범위 반영 후 일정 재검토 중' }
    ]
  }
]
