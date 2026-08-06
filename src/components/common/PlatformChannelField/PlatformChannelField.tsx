import { useEffect, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { listYoutubeConnections, openYoutubeOAuthPopup, requestYoutubeConnectStartUrl, type YoutubeConnectionSummary } from '../../../lib/youtubeApi'
import styles from './PlatformChannelField.module.scss'

type PlatformChannelFieldProps = {
  platformName?: string
}

function PlatformChannelField({ platformName = 'YouTube' }: PlatformChannelFieldProps) {
  const [channels, setChannels] = useState<YoutubeConnectionSummary[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [isSelectingChannel, setSelectingChannel] = useState(false)
  const [isConnecting, setConnecting] = useState(false)
  const [isCheckingConnection, setCheckingConnection] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const isConnected = channels.length > 0

  useEffect(() => {
    let cancelled = false
    listYoutubeConnections()
      .then((result) => {
        if (cancelled) return
        setChannels(result)
        setSelectedChannelId(result[0]?.id ?? '')
      })
      .catch(() => {
        // 목록 조회 실패는 "연결 안 됨" 상태로 조용히 처리한다.
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingConnection(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleConnect() {
    setErrorMessage('')
    setConnecting(true)
    try {
      const startUrl = await requestYoutubeConnectStartUrl()
      const result = await openYoutubeOAuthPopup(startUrl)
      if (!result.success) {
        setErrorMessage('YouTube 연결에 실패했어요. 다시 시도해 주세요.')
        return
      }
      const updated = await listYoutubeConnections()
      setChannels(updated)
      setSelectedChannelId(updated[0]?.id ?? '')
    } catch {
      setErrorMessage('YouTube 연결에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setConnecting(false)
    }
  }

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId)

  return (
    <div className={styles.platformField}>
      <div className={styles.platformRow}>
        {isConnected && isSelectingChannel ? (
          <Dropdown
            label="채널 선택"
            hideLabel
            className={styles.platformSelect}
            options={channels.map((channel) => ({ label: channel.channelTitle ?? channel.youtubeChannelId, value: channel.id }))}
            value={selectedChannelId}
            onChange={(event) => {
              setSelectedChannelId(event.target.value)
              setSelectingChannel(false)
            }}
          />
        ) : (
          <div className={styles.platformSelect}>
            <span className={styles.platformSelectText}>
              {platformName}
              {isConnected && selectedChannel && (
                <span className={styles.channelName}>{selectedChannel.channelTitle ?? selectedChannel.youtubeChannelId}</span>
              )}
              <span className={styles.platformBadge}>{isConnected ? '연결됨' : '연결 안 됨'}</span>
            </span>
          </div>
        )}
        <button
          type="button"
          className={styles.connectButton}
          disabled={isConnecting || isCheckingConnection}
          onClick={isConnected ? () => setSelectingChannel(true) : handleConnect}
        >
          {isCheckingConnection ? '확인중' : isConnecting ? '연결 중...' : isConnected ? '채널 변경' : '연결'}
        </button>
      </div>
      {!isConnected && <p className={styles.platformHint}>게시 전에 연결할 수 있습니다.</p>}
      {errorMessage && <p className={styles.platformError}>{errorMessage}</p>}
    </div>
  )
}

export default PlatformChannelField
