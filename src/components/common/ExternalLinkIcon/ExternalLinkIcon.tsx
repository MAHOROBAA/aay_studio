type ExternalLinkIconProps = {
  className?: string
}

function ExternalLinkIcon({ className }: ExternalLinkIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.66667 3.33334H3.33333C2.59695 3.33334 2 3.9303 2 4.66667V12.6667C2 13.4031 2.59695 14 3.33333 14H11.3333C12.0697 14 12.6667 13.4031 12.6667 12.6667V9.33334"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.33333 2H14V6.66667" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66667 9.33334L14 2" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default ExternalLinkIcon
