// veo-3.1-lite-generate-preview(720p) 실측 원가(Google AI Studio 청구 내역 기준, 2026-08-03).
// 초당 단가가 아니라 길이별로 다른 요금이 붙는 것으로 확인돼(4초=100.43원, 8초=290.57원 —
// 45% 이상 차이가 나서 선형 비례가 아님), 길이별 고정 요금표로 관리한다.
// 모델이나 해상도가 바뀌면 이 표도 다시 실측해서 갱신해야 한다.
const VIDEO_DURATION_COST_KRW: Record<number, number> = {
  4: 100.43,
  8: 290.57,
}

export function getVideoCostKrw(durationSeconds: number): number {
  const exact = VIDEO_DURATION_COST_KRW[durationSeconds]
  if (exact !== undefined) {
    return exact
  }

  // 아직 실측 안 된 길이는 원가를 과소 청구하지 않도록 가장 가까운 상위 구간 요금을 쓴다.
  const knownDurations = Object.keys(VIDEO_DURATION_COST_KRW)
    .map(Number)
    .sort((a, b) => a - b)
  const higherTier =
    knownDurations.find((duration) => duration >= durationSeconds) ??
    knownDurations[knownDurations.length - 1]

  console.error(
    `[getVideoCostKrw] ${durationSeconds}초 영상 원가는 아직 실측되지 않았어요. ${higherTier}초 요금(${VIDEO_DURATION_COST_KRW[higherTier]}원)으로 보수적으로 계산합니다.`,
  )
  return VIDEO_DURATION_COST_KRW[higherTier]
}
