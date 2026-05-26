<script setup lang="ts">
import { useRouter } from 'vue-router'
import AuthModal from '@/components/common/AuthModal.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogin(payload: { email: string; password: string }) {
  if (userStore.login(payload.email, payload.password)) {
    router.push({ name: 'dashboard' })
  }
}

function handleSignup(payload: { name: string; email: string; password: string; companyName: string; position: string; phone: string }) {
  userStore.register(payload)
  router.push({ name: 'dashboard' })
}

function goHome() {
  router.push({ name: 'landing' })
}
</script>

<template>
  <div class="login-page">
    <AuthModal mode="login" @close="goHome" @login="handleLogin" @signup="handleSignup" />
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f8fafc;
}
</style>
