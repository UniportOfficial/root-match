<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
  Factory,
  FileUp,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck
} from 'lucide-vue-next'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import ProcessStepper from '@/components/common/ProcessStepper.vue'
import { transactionCases, transactionSteps } from '@/data/transactionData'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const route = useRoute()
const workflowStore = useWorkflowStore()

const transaction = computed(() => transactionCases.find((item) => item.id === route.params.id) ?? transactionCases[0])

function approveInspection() {
  workflowStore.approveInspection()
  router.push('/transaction/review')
}

function reportIssue() {
  router.push('/disputes/mediation')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <RouterLink
        to="/transactions"
        class="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
      >
        <ArrowLeft class="h-4 w-4" />
        거래 진행 현황으로 돌아가기
      </RouterLink>

      <header class="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <AppBadge variant="blue">
          <ShieldCheck class="h-4 w-4" />
          거래 진행 관리
        </AppBadge>
        <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-bold text-slate-500">{{ transaction.id }}</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{{ transaction.projectName }}</h1>
            <p class="mt-3 text-lg text-slate-600">{{ transaction.nextAction }}</p>
          </div>
          <AppBadge :variant="transaction.statusKey === 'completed' ? 'green' : 'blue'">
            <CheckCircle class="h-4 w-4" />
            {{ transaction.status }}
          </AppBadge>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main class="space-y-8">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 class="mb-5 text-2xl font-bold text-slate-950">전체 거래 흐름</h2>
            <ProcessStepper :steps="transactionSteps" :current-step="transaction.currentStep" />
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div class="mb-5 flex items-center gap-3">
              <Factory class="h-6 w-6 text-blue-600" />
              <h2 class="text-2xl font-bold text-slate-950">작업 상태 업데이트</h2>
            </div>
            <div class="mb-6">
              <div class="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>진행률</span>
                <span>{{ transaction.progressRate }}%</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-blue-600" :style="{ width: `${transaction.progressRate}%` }"></div>
              </div>
            </div>
            <ol class="space-y-4">
              <li v-for="item in transaction.updates" :key="item.title" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-bold text-slate-950">{{ item.title }}</h3>
                    <p class="mt-1 text-base text-slate-600">{{ item.description }}</p>
                  </div>
                  <span class="shrink-0 text-sm font-semibold text-slate-500">{{ item.date }}</span>
                </div>
              </li>
            </ol>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div class="mb-5 flex items-center gap-3">
              <Truck class="h-6 w-6 text-blue-600" />
              <h2 class="text-2xl font-bold text-slate-950">납품 등록 및 검수</h2>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="mb-3 flex items-center gap-2 text-base font-bold text-slate-950">
                  <FileUp class="h-5 w-5 text-blue-600" />
                  납품 사진
                </div>
                <p class="truncate text-sm text-slate-600">{{ transaction.deliveryFile.name }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="mb-3 flex items-center gap-2 text-base font-bold text-slate-950">
                  <ClipboardCheck class="h-5 w-5 text-blue-600" />
                  검사 결과서
                </div>
                <p class="truncate text-sm text-slate-600">{{ transaction.inspectionFile.name }}</p>
              </div>
            </div>
            <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AppButton type="button" size="lg" full-width @click="approveInspection">
                <PackageCheck class="h-6 w-6" />
                검수 승인하고 리뷰 작성
              </AppButton>
              <AppButton type="button" size="lg" variant="secondary" full-width @click="reportIssue">
                <AlertTriangle class="h-6 w-6" />
                문제 발생, 중재 신청
              </AppButton>
            </div>
          </section>
        </main>

        <aside class="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-xl font-bold text-slate-950">거래 상세 정보</h2>
            <dl class="mt-5 space-y-4">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">발주처</dt>
                <dd class="font-semibold text-slate-950">{{ transaction.client }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">공장</dt>
                <dd class="font-semibold text-slate-950">{{ transaction.factory }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">계약 금액</dt>
                <dd class="font-semibold text-slate-950">{{ transaction.amount }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">납기</dt>
                <dd class="font-semibold text-slate-950">{{ transaction.dueDate }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">최근 업데이트</dt>
                <dd class="font-semibold text-slate-950">{{ transaction.updatedAt }}</dd>
              </div>
            </dl>
          </div>

          <div class="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div class="flex items-start gap-3">
              <RefreshCw class="h-6 w-6 text-blue-600" />
              <p class="text-base leading-7 text-slate-700">
                검수 승인 시 에스크로 정산이 진행되고, 문제가 있으면 플랫폼 중재 절차로 이어집니다.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
