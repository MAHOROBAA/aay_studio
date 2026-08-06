import { useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import styles from './PlatformChannelField.module.scss'

type ChannelOption = {
  id: string
  name: string
}

// TODO: 실제 YouTube 채널 연결/조회는 3차(YouTube 연동)에서 백엔드와 연결한다. 지금은 프론트 목업 상태다.
const MOCK_CHANNELS: ChannelOption[] = [{ id: 'ch1', name: '마호의유튜브' }]

type PlatformChannelFieldProps = {
  platformName?: string
}

function PlatformChannelField({ platformName = 'YouTube' }: PlatformChannelFieldProps) {
  const [isConnected, setConnected] = useState(false)
  const [channels, setChannels] = useState<ChannelOption[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [isSelectingChannel, setSelectingChannel] = useState(false)

  function handleConnect() {
    setChannels(MOCK_CHANNELS)
    setSelectedChannelId(MOCK_CHANNELS[0].id)
    setConnected(true)
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
            options={channels.map((channel) => ({ label: channel.name, value: channel.id }))}
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
              {isConnected && selectedChannel && <span className={styles.channelName}>{selectedChannel.name}</span>}
              <span className={styles.platformBadge}>{isConnected ? '연결됨' : '연결 안 됨'}</span>
            </span>
          </div>
        )}
        <button
          type="button"
          className={styles.connectButton}
          onClick={isConnected ? () => setSelectingChannel(true) : handleConnect}
        >
          {isConnected ? '채널 변경' : '연결'}
        </button>
      </div>
      {!isConnected && <p className={styles.platformHint}>게시 전에 연결할 수 있습니다.</p>}
    </div>
  )
}

export default PlatformChannelField
