import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Company } from '@/types'
import { mockCurrentUser } from '@/data/mockData'

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-format' | 'invalid-credentials' }

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const MIN_PASSWORD_LENGTH = 6

export const useUserStore = defineStore(
  'user',
  () => {
    const currentUser = ref<User | null>(null)
    const isAuthenticated = computed(() => currentUser.value !== null)

    // TODO(Phase B): 실제 백엔드 API 호출로 교체. 현재는 mock 단계 — 형식 검증만 수행.
    function login(email: string, password: string): LoginResult {
      if (!EMAIL_PATTERN.test(email) || password.length < MIN_PASSWORD_LENGTH) {
        return { ok: false, reason: 'invalid-format' }
      }

      currentUser.value = {
        ...mockCurrentUser,
        id: `user-${Date.now()}`,
        email,
        name: mockCurrentUser.name,
      }
      return { ok: true }
    }

    function register(payload: {
      name: string
      email: string
      password: string
      companyName: string
      position: string
      phone: string
    }) {
      currentUser.value = {
        id: `user-${Date.now()}`,
        email: payload.email,
        name: payload.name,
        position: payload.position,
        phone: payload.phone,
        role: 'member',
        company: {
          id: `company-${Date.now()}`,
          name: payload.companyName,
          industry: '제조/서비스',
          region: '서울',
          size: '중소기업',
          description: `${payload.companyName} 회원사`,
          tags: ['회원가입'],
          contactEmail: payload.email,
          contactPhone: payload.phone,
          website: '',
          establishedYear: new Date().getFullYear(),
          employeeCount: 10,
          certifications: [],
          createdAt: new Date().toISOString(),
        },
      }
    }

    function updateProfile(updates: Partial<User>) {
      if (currentUser.value) {
        currentUser.value = { ...currentUser.value, ...updates }
      }
    }

    function updateCompany(updates: Partial<Company>) {
      if (currentUser.value?.company) {
        currentUser.value.company = { ...currentUser.value.company, ...updates }
      }
    }

    function logout() {
      currentUser.value = null
    }

    return {
      currentUser,
      isAuthenticated,
      login,
      register,
      updateProfile,
      updateCompany,
      logout,
    }
  },
  {
    persist: {
      key: 'rootmatching-user',
      pick: ['currentUser'],
      storage: localStorage,
    },
  },
)
