type EditIconProps = {
  className?: string
}

function EditIcon({ className }: EditIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.66667 4.66667H4C3.64638 4.66667 3.30724 4.80714 3.05719 5.05719C2.80714 5.30724 2.66667 5.64638 2.66667 6V12C2.66667 12.3536 2.80714 12.6928 3.05719 12.9428C3.30724 13.1929 3.64638 13.3333 4 13.3333H10C10.3536 13.3333 10.6928 13.1929 10.9428 12.9428C11.1929 12.6928 11.3333 12.3536 11.3333 12V11.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.0001 3.39999C14.0001 3.77131 13.8526 4.12743 13.59 4.38999L8 9.99999H6V7.99999L11.61 2.40999C11.8726 2.14743 12.2287 1.99992 12.6 1.99992C12.9713 1.99992 13.3274 2.14743 13.59 2.40999C13.8526 2.67255 14.0001 3.02867 14.0001 3.39999Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.6667 3.33333L12.6667 5.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default EditIcon
