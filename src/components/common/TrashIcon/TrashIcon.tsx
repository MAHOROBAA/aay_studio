type TrashIconProps = {
  className?: string
}

function TrashIcon({ className }: TrashIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.66662 4.66707H13.3333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66662 7.33353V11.3335" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.33338 7.33353V11.3335" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3.33338 4.66707L4.00005 12.6671C4.00005 13.0207 4.14053 13.3598 4.39057 13.6099C4.64062 13.8599 4.97976 14.0004 5.33338 14.0004H10.6667C11.0203 14.0004 11.3595 13.8599 11.6095 13.6099C11.8596 13.3598 12 13.0207 12 12.6671L12.6667 4.66707"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 4.66667V2.66667C6 2.48986 6.07024 2.32029 6.19526 2.19526C6.32029 2.07024 6.48986 2 6.66667 2H9.33333C9.51014 2 9.67971 2.07024 9.80474 2.19526C9.92976 2.32029 10 2.48986 10 2.66667V4.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default TrashIcon
