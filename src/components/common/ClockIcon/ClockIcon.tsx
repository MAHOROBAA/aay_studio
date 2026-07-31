type ClockIconProps = {
  className?: string
}

function ClockIcon({ className }: ClockIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 7.99957C13.9999 6.84054 13.6641 5.70634 13.0332 4.73405C12.4024 3.76177 11.5034 2.99302 10.4449 2.52073C9.38647 2.04844 8.21388 1.89283 7.06889 2.07269C5.92389 2.25256 4.8555 2.7602 3.99285 3.53428C3.13019 4.30835 2.5102 5.31571 2.20781 6.4346C1.90541 7.55349 1.93356 8.73602 2.28886 9.83926C2.64415 10.9425 3.31138 11.9192 4.20989 12.6514C5.10841 13.3835 6.19974 13.8397 7.352 13.9649C7.56533 13.9876 7.78133 13.9996 8 13.9996"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 4.66647V7.9998L9.33333 9.33313" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12.28 10.4065C12.41 10.2765 12.5644 10.1733 12.7342 10.103C12.9041 10.0326 13.0861 9.99639 13.27 9.99639C13.4539 9.99639 13.6359 10.0326 13.8058 10.103C13.9756 10.1733 14.13 10.2765 14.26 10.4065C14.39 10.5365 14.4931 10.6908 14.5635 10.8607C14.6339 11.0305 14.6701 11.2126 14.6701 11.3965C14.6701 11.5803 14.6339 11.7624 14.5635 11.9322C14.4931 12.1021 14.39 12.2565 14.26 12.3865L12 14.6665H10V12.6665L12.28 10.4065Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ClockIcon
