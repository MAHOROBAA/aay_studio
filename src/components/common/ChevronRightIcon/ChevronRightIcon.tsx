type ChevronRightIconProps = {
  className?: string
}

function ChevronRightIcon({ className }: ChevronRightIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.33531 4.99964L9.50002 8.16428L6.33531 11.329"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChevronRightIcon
