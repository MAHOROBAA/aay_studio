import styles from './StatusBadge.module.scss'

export type VideoStatus = '게시 완료' | '예약 게시' | '게시 실패'

const STATUS_CLASS_NAME: Record<VideoStatus, string> = {
  '게시 완료': styles.done,
  '예약 게시': styles.scheduled,
  '게시 실패': styles.failed,
}

type StatusBadgeProps = {
  status: VideoStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={[styles.badge, STATUS_CLASS_NAME[status]].join(' ')}>{status}</span>
}

export default StatusBadge
