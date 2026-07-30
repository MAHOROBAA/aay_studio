type ChevronDownIconProps = {
  className?: string
}

function ChevronDownIcon({ className }: ChevronDownIconProps) {
  return (
    <svg className={className} viewBox="0 0 13.3333 13.3333" fill="none" aria-hidden="true">
      <path
        d="M9.8313 5.08433L6.66666 8.24904L3.50195 5.08433"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChevronDownIcon
