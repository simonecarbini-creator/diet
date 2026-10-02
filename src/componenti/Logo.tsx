/** Logo orizzontale (ciambella + DIET) dal kit diet-brand, in public/logo. */
export function Logo({ className = 'h-9' }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo/logo-horizontal.svg`} alt="DIET" className={`w-auto ${className}`} />
}
