import type { CompanyDetail, FactoryRecommendation } from '@rootmatching/shared'
import type { VerificationState, VerificationType } from '@/components/profile/VerificationBadge'

export interface MatchingVerification {
  type: VerificationType
  label: string
  state: VerificationState
  evidence: string
}

type DerivableFactory = Pick<
  FactoryRecommendation,
  | 'id'
  | 'name'
  | 'location'
  | 'processes'
  | 'trustScore'
  | 'distanceKm'
  | 'region'
  | 'industry'
  | 'confidenceTier'
  | 'processHint'
  | 'externalId'
>

function deriveBusiness(factory: DerivableFactory): MatchingVerification {
  return {
    type: 'business',
    label: '사업자',
    state: 'verified',
    evidence: factory.externalId
      ? `사업자 등록번호 ${factory.externalId} 매핑 완료`
      : `매칭 풀 등록 ID ${factory.id}`,
  }
}

function deriveLocation(factory: DerivableFactory): MatchingVerification {
  if (factory.region && factory.region.length > 0) {
    return {
      type: 'location',
      label: '위치',
      state: 'verified',
      evidence: `${factory.region} 거점 · ${factory.location} 주소 확인`,
    }
  }

  if (factory.location && factory.location.length > 0) {
    return {
      type: 'location',
      label: '위치',
      state: 'verified',
      evidence: `${factory.location} 주소 확인`,
    }
  }

  return {
    type: 'location',
    label: '위치',
    state: 'pending',
    evidence: '거점 매니저가 위치 정보를 보강 중입니다.',
  }
}

function deriveEquipment(factory: DerivableFactory): MatchingVerification {
  if (factory.processes && factory.processes.length > 0) {
    return {
      type: 'equipment',
      label: '장비',
      state: 'verified',
      evidence: `보유 공정 ${factory.processes.length}종: ${factory.processes.join(' · ')}`,
    }
  }

  if (factory.processHint && factory.processHint.length > 0) {
    return {
      type: 'equipment',
      label: '장비',
      state: 'verified',
      evidence: `보유 공정 힌트: ${factory.processHint}`,
    }
  }

  return {
    type: 'equipment',
    label: '장비',
    state: 'pending',
    evidence: '거점 매니저가 장비 사양을 확인 중입니다.',
  }
}

function deriveCertification(factory: DerivableFactory): MatchingVerification {
  switch (factory.confidenceTier) {
    case 'A_CERTIFIED_ROOT':
      return {
        type: 'certification',
        label: '인증',
        state: 'verified',
        evidence: '국가뿌리산업진흥센터 등록 (A 등급)',
      }
    case 'B_LOCAL_STRONG_INSIDE':
      return {
        type: 'certification',
        label: '인증',
        state: 'verified',
        evidence: '지역 강소기업 풀 등록 (B 등급)',
      }
    case 'C_BORDERLINE_INSIDE':
      return {
        type: 'certification',
        label: '인증',
        state: 'pending',
        evidence: '경계 등급 (C) — 추가 인증 확인 중',
      }
    case 'D_LOW_CONFIDENCE':
      return {
        type: 'certification',
        label: '인증',
        state: 'missing',
        evidence: '저신뢰 등급 (D) — 인증 자료 보강 필요',
      }
    default:
      break
  }

  if (factory.trustScore >= 85) {
    return {
      type: 'certification',
      label: '인증',
      state: 'verified',
      evidence: `신뢰 점수 ${factory.trustScore} — 검증 인증 풀 등재`,
    }
  }

  if (factory.trustScore >= 70) {
    return {
      type: 'certification',
      label: '인증',
      state: 'pending',
      evidence: `신뢰 점수 ${factory.trustScore} — 추가 검증 진행 중`,
    }
  }

  return {
    type: 'certification',
    label: '인증',
    state: 'missing',
    evidence: '인증 자료가 충분하지 않습니다.',
  }
}

function deriveOnsite(factory: DerivableFactory): MatchingVerification {
  if (factory.confidenceTier === 'A_CERTIFIED_ROOT') {
    return {
      type: 'onsite',
      label: '현장',
      state: 'verified',
      evidence: '거점 매니저 현장 방문 완료 (인증 풀)',
    }
  }

  if (typeof factory.distanceKm === 'number' && factory.distanceKm <= 30) {
    return {
      type: 'onsite',
      label: '현장',
      state: 'pending',
      evidence: `${factory.distanceKm}km 근거리 — 현장 방문 일정 조율 중`,
    }
  }

  if (typeof factory.distanceKm === 'number') {
    return {
      type: 'onsite',
      label: '현장',
      state: 'pending',
      evidence: `거점에서 ${factory.distanceKm}km — 방문 일정 협의 중`,
    }
  }

  return {
    type: 'onsite',
    label: '현장',
    state: 'missing',
    evidence: '현장 방문이 아직 예약되지 않았습니다.',
  }
}

export function deriveMatchingVerifications(factory: DerivableFactory): MatchingVerification[] {
  return [
    deriveBusiness(factory),
    deriveLocation(factory),
    deriveEquipment(factory),
    deriveCertification(factory),
    deriveOnsite(factory),
  ]
}

function companyDetailToDerivableFactory(company: CompanyDetail): DerivableFactory {
  const profile = company.factoryProfile
  const processes = profile?.specialty.length
    ? profile.specialty
    : profile?.processes.length
      ? profile.processes
      : []

  return {
    id: company.id,
    name: company.name,
    location: profile?.location ?? company.address ?? company.region,
    processes,
    trustScore: profile?.trustScore ?? 80,
    region: company.region,
    industry: company.industry,
    confidenceTier: company.confidenceTier,
    processHint: company.processHint,
    externalId: company.externalId,
  }
}

function deriveCompanyEquipment(company: CompanyDetail): MatchingVerification {
  const equipment = company.factoryProfile?.equipment ?? []
  if (equipment.length > 0) {
    return {
      type: 'equipment',
      label: '장비',
      state: 'verified',
      evidence: `보유 설비 ${equipment.length}종: ${equipment.slice(0, 3).join(' · ')}${
        equipment.length > 3 ? ' 외' : ''
      }`,
    }
  }
  return deriveEquipment(companyDetailToDerivableFactory(company))
}

function deriveCompanyCertification(company: CompanyDetail): MatchingVerification {
  if (company.certifications.length > 0) {
    return {
      type: 'certification',
      label: '인증',
      state: 'verified',
      evidence: `보유 인증 ${company.certifications.length}건: ${company.certifications
        .slice(0, 3)
        .join(' · ')}${company.certifications.length > 3 ? ' 외' : ''}`,
    }
  }
  return deriveCertification(companyDetailToDerivableFactory(company))
}

function deriveCompanyOnsite(company: CompanyDetail): MatchingVerification {
  if (company.factoryProfile?.verified === true) {
    return {
      type: 'onsite',
      label: '현장',
      state: 'verified',
      evidence: '거점 매니저 현장 방문 완료 (인증 공장)',
    }
  }
  if (company.factoryProfile && company.factoryProfile.isSynthesized === false) {
    return {
      type: 'onsite',
      label: '현장',
      state: 'pending',
      evidence: '공장 프로필 등록 완료 — 현장 방문 일정 협의 중',
    }
  }
  return deriveOnsite(companyDetailToDerivableFactory(company))
}

export function deriveCompanyVerifications(company: CompanyDetail): MatchingVerification[] {
  const derivable = companyDetailToDerivableFactory(company)
  return [
    deriveBusiness(derivable),
    deriveLocation(derivable),
    deriveCompanyEquipment(company),
    deriveCompanyCertification(company),
    deriveCompanyOnsite(company),
  ]
}
