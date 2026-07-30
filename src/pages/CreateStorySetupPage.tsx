import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Dropdown from '../components/common/Dropdown/Dropdown'
import styles from './CreateStorySetupPage.module.scss'

const STEPS = [
  { id: 'section-character', label: '캐릭터' },
  { id: 'section-world', label: '세계관' },
  { id: 'section-story', label: '스토리' },
]

function CreateStorySetupPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.introTitle}>AI 동물 숏폼</p>
          <p className={styles.introSubtitle}>일관된 캐릭터와 세계관으로 짧은 이야기를 만들어요.</p>
        </div>

        <section id="section-character" className={styles.section}>
          <h2 className={styles.sectionTitle}>캐릭터</h2>
          <div className={styles.row}>
            <p className={styles.rowLabel}>주인공</p>
            <div className={styles.characterField}>
              <div className={styles.characterPreview}>
                <p>
                  캐릭터 이미지가
                  <br />
                  여기에 표시됩니다
                </p>
              </div>
              <Dropdown
                label="캐릭터 선택"
                hideLabel
                className={styles.characterSelect}
                options={[{ label: '캐릭터 선택', value: '' }]}
              />
            </div>
            <button type="button" className={styles.chipButton}>
              새 캐릭터 만들기
            </button>
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>주변 인물</p>
            <button type="button" className={styles.chipButton}>
              <svg className={styles.chipIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3.333V12.667M3.333 8H12.667" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              캐릭터 추가
            </button>
          </div>
        </section>

        <section id="section-world" className={styles.section}>
          <h2 className={styles.sectionTitle}>세계관</h2>
          <div className={styles.optionsRow}>
            <Dropdown
              label="세계관 선택"
              hideLabel
              className={styles.worldSelect}
              options={[{ label: '세계관 선택', value: '' }]}
            />
            <button type="button" className={styles.chipButtonMuted}>
              새 세계관 만들기
            </button>
            <button type="button" className={styles.chipButtonMuted}>
              사용하지 않기
            </button>
          </div>
          <div className={styles.textareaBox}>
            <p className={styles.textareaPlaceholder}>새로운 세계관을 입력해 주세요.</p>
            <p className={styles.textareaCounter}>0 / 1,000</p>
          </div>
        </section>

        <section id="section-story" className={styles.section}>
          <h2 className={styles.sectionTitle}>스토리</h2>
          <div className={styles.optionsRow}>
            <button type="button" className={styles.chipButton}>
              새 이야기 만들기
            </button>
            <Dropdown
              label="이전 이야기 이어가기"
              hideLabel
              className={styles.worldSelect}
              options={[{ label: '이전 이야기 이어가기', value: '' }]}
            />
          </div>
          <div className={styles.textareaBox}>
            <p className={styles.textareaPlaceholder}>새로운 이야기에 대한 간단한 아이디어를 적어 주세요.</p>
            <p className={styles.textareaCounter}>0 / 500</p>
          </div>
        </section>

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={() => navigate('/create/settings')}>
            AI 기획 만들기 →
          </Button>
        </div>
      </div>

      <aside className={styles.stepper}>
        {STEPS.map((step, index) => (
          <div key={step.id} className={styles.stepItem}>
            <span className={[styles.stepBadge, index === 0 ? styles.stepBadgeActive : ''].join(' ')}>
              {index + 1}
            </span>
            <p className={styles.stepLabel}>{step.label}</p>
            {index < STEPS.length - 1 && <div className={styles.stepConnector} />}
          </div>
        ))}
      </aside>
    </div>
  )
}

export default CreateStorySetupPage
