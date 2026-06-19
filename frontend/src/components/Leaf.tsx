type Props = {
  className?: string
  size?: number
}

export function Leaf({ className = "", size = 12 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 2 C 7 3, 2 8, 2 14 C 8 14, 13 9, 14 2 Z"
        fill="currentColor"
      />
    </svg>
  )
}