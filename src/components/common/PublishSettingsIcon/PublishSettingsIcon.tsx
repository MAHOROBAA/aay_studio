type PublishSettingsIconProps = {
  className?: string
}

function PublishSettingsIcon({ className }: PublishSettingsIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 13.9998H4.66667L13.3333 5.33313C13.687 4.97951 13.8856 4.4999 13.8856 3.9998C13.8856 3.4997 13.687 3.02009 13.3333 2.66647C12.9797 2.31285 12.5001 2.11418 12 2.11418C11.4999 2.11418 11.0203 2.31285 10.6667 2.66647L2 11.3331V13.9998Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.66662 3.66647L12.3333 6.33313" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 5.33333L4.66667 2L2 4.66667L5.33333 8"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.66662 5.33353L3.66662 6.33353" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10.6667 8L14 11.3333L11.3333 14L8 10.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.6666 11.3335L9.66662 12.3335" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default PublishSettingsIcon
