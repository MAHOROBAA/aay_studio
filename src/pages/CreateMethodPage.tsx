import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import styles from './CreateMethodPage.module.scss'

function CreateMethodPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.createMethod}>
      <h1 className={styles.heading}>원하는 방식을 선택하세요.</h1>
      <div className={styles.options}>
        <div className={styles.option}>
          <p className={styles.optionDescription}>{'영상 유형에 맞춰 준비된 제작 흐름으로\n빠르게 시작해보세요.'}</p>
          <Button type="button" variant="primary" onClick={() => navigate('/create/story')}>
            스토리 영상 만들기 →
          </Button>
        </div>
        <div className={styles.option}>
          <p className={styles.optionDescription}>{'프롬프트부터 영상 설정까지\n원하는 대로 직접 구성해보세요.'}</p>
          <Button type="button" variant="primary" onClick={() => navigate('/create/free')}>
            자유 영상 만들기 →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateMethodPage
