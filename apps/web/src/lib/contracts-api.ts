export async function mapContractError(response: Response): Promise<string> {
  const status = response.status
  let bodyText = ''
  try {
    const body = (await response.json()) as { message?: unknown; error?: unknown }
    const msg = typeof body.message === 'string' ? body.message : ''
    const err = typeof body.error === 'string' ? body.error : ''
    bodyText = `${msg} ${err}`.toLowerCase()
  } catch {
    bodyText = ''
  }

  if (status === 401) return '다시 로그인이 필요합니다'
  if (status === 403) return '이 작업을 수행할 권한이 없습니다'
  if (status === 404) return '계약 정보를 찾을 수 없어요'
  if (status === 409) return '이미 발송된 계약입니다. 잠시 후 다시 확인해주세요'
  if (status === 400 && bodyText.includes('signingcontactinfo')) {
    return '참여자 연락처를 확인하고 다시 시도해주세요'
  }
  if (status === 400) return '입력값을 확인해주세요'
  if (status >= 500) return '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
  return '요청을 처리할 수 없어요. 잠시 후 다시 시도해주세요'
}
