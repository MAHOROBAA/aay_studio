import styles from './VideoPreview.module.scss'

type VideoPreviewProps = {
  width: number
  height: number
  contentWidth: number
  progressPercent: number
}

function VideoPreview({ width, height, contentWidth, progressPercent }: VideoPreviewProps) {
  return (
    <div className={styles.wrapper} style={{ width }}>
      <div className={styles.frame} style={{ width, height }}>
        <div className={styles.content} style={{ width: contentWidth, height }} />
      </div>
      <div className={styles.controls}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <div className={styles.buttons}>
          <button type="button" className={styles.playButton} aria-label="재생">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <circle cx="15" cy="15" r="15" fill="currentColor" />
              <path d="M12 9.5L20 15L12 20.5V9.5Z" fill="white" />
            </svg>
          </button>
          <button type="button" className={styles.volumeButton} aria-label="음량">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 6V10H5L9 13V3L5 6H2Z" fill="currentColor" />
              <path
                d="M11.5 5.5C12.5 6.5 12.5 9.5 11.5 10.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview
