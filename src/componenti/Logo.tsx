// SEGNAPOSTO: da sostituire con il logo definitivo quando arrivano i file.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg bg-cho text-base font-bold text-white ${className}`}
      aria-hidden="true"
    >
      D
    </span>
  )
}
