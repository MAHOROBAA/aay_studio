import { useNavigate } from 'react-router-dom'
import InfoCard from '../components/common/InfoCard/InfoCard'
import VideoPreview from '../components/common/VideoPreview/VideoPreview'
import StatusBadge from '../components/common/StatusBadge/StatusBadge'
import LibraryDetailHeader from '../components/common/LibraryDetailHeader/LibraryDetailHeader'
import styles from './LibraryVideoDetailPage.module.scss'

const VIDEO_INFO_ITEMS = [
  { label: '화면 비율', value: '9:16 세로형' },
  { label: '영상 길이', value: '20초' },
  { label: '해상도', value: '1080p' },
  { label: '오디오', value: '음악 + 효과음' },
  { label: '사용 크레딧', value: '24 크레딧' },
]

const PLATFORM_INFO_ITEMS = [
  { label: '게시 플랫폼', value: 'YouTube' },
  { label: '계정', value: 'io******o@gmail.com' },
  { label: '게시 일시', value: '2026.07.27 오후 6:00' },
  { label: '게시물', value: 'YouTube에서 보기 ↗' },
]

function LibraryVideoDetailPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <LibraryDetailHeader
        backLabel="← 영상 목록"
        onBack={() => navigate('/library/videos')}
        title="영상 상세"
        badge={<StatusBadge status="게시 완료" />}
        showActions={false}
      />

      <div className={styles.content}>
        <div className={styles.topRow}>
          <VideoPreview width={300} height={168.75} contentWidth={103} progressPercent={23} />
          <InfoCard title="영상 정보" items={VIDEO_INFO_ITEMS} />
          <InfoCard title="게시 플랫폼 정보" items={PLATFORM_INFO_ITEMS} />
        </div>

        <div className={styles.row}>
          <p className={styles.rowLabel}>제목</p>
          <div className={styles.readonlyBox}>
            <p className={styles.readonlyText}>콘텐츠 제목이 여기에 나타납니다</p>
          </div>
        </div>

        <div className={[styles.row, styles.rowStart].join(' ')}>
          <p className={[styles.rowLabel, styles.rowLabelStart].join(' ')}>게시글 내용</p>
          <div className={styles.readonlyBoxTall}>
            <p className={styles.readonlyText}>
              게시글 내용이 여기에 나타납니다.
              <br />
              작성한 게시글 내용을 저장해 여기에 노출합니다.
            </p>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaField}>
            <p className={styles.rowLabel}>시청자층</p>
            <div className={styles.metaBox}>전체연령가</div>
          </div>
          <div className={styles.metaField}>
            <p className={styles.rowLabel}>공개 범위</p>
            <div className={styles.metaBox}>공개</div>
          </div>
          <div className={styles.metaField}>
            <p className={styles.rowLabel}>게시 방식</p>
            <div className={styles.metaBox}>즉시 게시</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryVideoDetailPage
