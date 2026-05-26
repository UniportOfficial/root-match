<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthModal from '@/components/common/AuthModal.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const authError = ref('')

function handleLogin(payload: { email: string; password: string }) {
  const result = userStore.login(payload.email, payload.password)
  if (result.ok) {
    authError.value = ''
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.push(redirect || { name: 'dashboard' })
    return
  }
  authError.value = '이메일 또는 비밀번호 형식이 올바르지 않습니다.'
}

function handleSignup(payload: {
  name: string
  email: string
  password: string
  companyName: string
  position: string
  phone: string
}) {
  userStore.register(payload)
  router.push({ name: 'dashboard' })
}

function goHome() {
  router.push({ name: 'landing' })
}
</script>

<template>
  <div class="login-page">
    <AuthModal
      mode="login"
      :external-error="authError"
      @close="goHome"
      @login="handleLogin"
      @signup="handleSignup"
    />
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f8fafc;
}
</style>
