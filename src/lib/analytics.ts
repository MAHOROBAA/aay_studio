declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

let isReady = false

export function initAnalytics() {
  if (isReady || !MEASUREMENT_ID) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, import.meta.env.DEV ? { debug_mode: true } : undefined)

  isReady = true
}

// 로그인 성공 시 발급받은 비식별 UUID를 넘기고, 로그아웃 시 null로 초기화한다(addendum 17장).
// 실제 로그인이 아직 없어서(4단계 범위) 현재는 호출하는 곳이 없다.
export function setAnalyticsUserId(userId: string | null) {
  if (!isReady) {
    return
  }
  window.gtag('set', { user_id: userId })
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isReady) {
    return
  }
  window.gtag('event', eventName, params)
}

// addendum 19장 "서비스 활성화" 이벤트
export function trackCharacterCreated() {
  trackEvent('character_created')
}

export function trackWorldCreated() {
  trackEvent('world_created')
}

export function trackStoryCreated() {
  trackEvent('story_created')
}

// addendum 19~20장 "영상 제작" 이벤트
type CreationMethod = 'story' | 'free'

export function trackVideoCreationStarted(params: {
  creationMethod: CreationMethod
  duration: string
  ratio: string
  estimatedCreditAmount: number
}) {
  trackEvent('video_creation_started', {
    creation_method: params.creationMethod,
    duration: params.duration,
    ratio: params.ratio,
    estimated_credit_amount: params.estimatedCreditAmount,
  })
}

export function trackVideoCreationCompleted(params: {
  creationMethod: CreationMethod
  duration: string
  creditAmount: number
  retryCount: number
}) {
  trackEvent('video_creation_completed', {
    creation_method: params.creationMethod,
    duration: params.duration,
    credit_amount: params.creditAmount,
    retry_count: params.retryCount,
  })
}

export function trackGenerationRetry() {
  trackEvent('generation_retry')
}

export function trackReviewCompleted() {
  trackEvent('review_completed')
}

export function trackPublishCompleted(params: { platform: 'youtube'; publishType: 'immediate' | 'scheduled' }) {
  trackEvent('publish_completed', { platform: params.platform, publish_type: params.publishType })
}

// addendum 19~20장 "크레딧" 이벤트
export function trackCreditSpent(params: { actionType: string; creditAmount: number; balanceAfter: number }) {
  trackEvent('credit_spent', {
    action_type: params.actionType,
    credit_amount: params.creditAmount,
    balance_after: params.balanceAfter,
  })
}

export function trackCreditInsufficient(params: { actionType: string; requiredAmount: number; balance: number }) {
  trackEvent('credit_insufficient', {
    action_type: params.actionType,
    required_amount: params.requiredAmount,
    balance: params.balance,
  })
}

// addendum 18~19장 "결제" 이벤트(GA4 표준 전자상거래 이벤트 이름 그대로 사용)
type GaItem = {
  item_id: string
  item_name: string
  price: number
}

export function trackViewItemList(items: GaItem[]) {
  trackEvent('view_item_list', { items })
}

export function trackSelectItem(item: GaItem) {
  trackEvent('select_item', { items: [item] })
}

export function trackBeginCheckout(item: GaItem) {
  trackEvent('begin_checkout', { currency: 'KRW', value: item.price, items: [item] })
}

export function trackPurchase(params: {
  transactionId: string
  value: number
  item: GaItem
  paidCreditAmount: number
  bonusCreditAmount: number
}) {
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    currency: 'KRW',
    value: params.value,
    items: [params.item],
    product_id: params.item.item_id,
    paid_credit_amount: params.paidCreditAmount,
    bonus_credit_amount: params.bonusCreditAmount,
  })
}

export function trackPaymentFailed() {
  trackEvent('payment_failed')
}
