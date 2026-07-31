type DownloadIconProps = {
  className?: string
}

function DownloadIcon({ className }: DownloadIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.66662 11.3335V12.6669C2.66662 13.0205 2.80709 13.3596 3.05714 13.6097C3.30719 13.8597 3.64633 14.0002 3.99995 14.0002H12C12.3536 14.0002 12.6927 13.8597 12.9428 13.6097C13.1928 13.3596 13.3333 13.0205 13.3333 12.6669V11.3335"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.66662 7.33353L7.99995 10.6669L11.3333 7.33353" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 2.66647V10.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default DownloadIcon
