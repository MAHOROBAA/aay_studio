import Button from '../Button/Button'
import popupStyles from '../Popup/Popup.module.scss'
import youtubeIcon from '../../../assets/platforms/youtube.png'
import styles from './PublishCompletePopup.module.scss'

type PublishCompletePopupProps = {
  isOpen: boolean
  title: string
  channelName: string
  onGoToLibrary: () => void
  onGoHome: () => void
}

function PublishCompletePopup({ isOpen, title, channelName, onGoToLibrary, onGoHome }: PublishCompletePopupProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={popupStyles.dim}>
      <div className={popupStyles.card} role="dialog" aria-modal="true">
        <p className={popupStyles.brand}>Aaaay!</p>
        <h2 className={popupStyles.title}>게시 설정이 완료되었습니다.</h2>
        <div className={styles.infoBox}>
          <div className={styles.infoTable}>
            <div className={styles.infoLabels}>
              <p>플랫폼</p>
              <p>제목</p>
              <p>채널명</p>
            </div>
            <div className={styles.infoValues}>
              <div className={styles.platformRow}>
                <img className={styles.platformIcon} src={youtubeIcon} alt="" />
                <p>YouTube</p>
              </div>
              <p>{title}</p>
              <p>{channelName}</p>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onGoToLibrary}>
            라이브러리로
          </Button>
          <Button type="button" variant="primary" onClick={onGoHome}>
            홈으로
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PublishCompletePopup
