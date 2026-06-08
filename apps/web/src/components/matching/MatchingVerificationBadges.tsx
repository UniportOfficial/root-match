'use client'

import type { FactoryRecommendation } from '@rootmatching/shared'
import { VerificationBadge } from '@/components/profile/VerificationBadge'
import { deriveMatchingVerifications } from '@/lib/matching-verifications'
import { cn } from '@/lib/cn'

interface MatchingVerificationBadgesProps {
  factory: FactoryRecommendation
  className?: string
  layout?: 'grid' | 'stack'
}

export function MatchingVerificationBadges({
  factory,
  className,
  layout = 'grid',
}: MatchingVerificationBadgesProps) {
  const verifications = deriveMatchingVerifications(factory)

  return (
    <div
      className={cn(
        layout === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-col gap-2',
        className,
      )}
      role="group"
      aria-label="공장 검증 5종 (사업자·위치·장비·인증·현장)"
    >
      {verifications.map((verification) => (
        <VerificationBadge
          key={verification.type}
          type={verification.type}
          state={verification.state}
          label={verification.label}
          evidence={verification.evidence}
        />
      ))}
    </div>
  )
}
