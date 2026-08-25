interface IconProps {
  className?: string
}

export function SearchIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.25" /><path d="m16 16 4 4" /></svg>
}

export function DocumentIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.75h7l4 4v12.5h-11z" /><path d="M13.5 3.75v4h4M9.5 12h5M9.5 15.5h5" /></svg>
}

export function ExternalIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
}
