import styles from './StatusBadge.module.scss'

export type VideoStatus = '업로드 중' | '예약 게시' | '게시 완료' | '게시 실패'

const STATUS_CLASS_NAME: Record<VideoStatus, string> = {
  '업로드 중': styles.uploading,
  '예약 게시': styles.scheduled,
  '게시 완료': styles.done,
  '게시 실패': styles.failed,
}

type StatusBadgeProps = {
  status: VideoStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={[styles.badge, STATUS_CLASS_NAME[status]].join(' ')}>{status}</span>
}

export default StatusBadge
