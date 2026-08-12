export function ErrorNotice({ children }: { children: React.ReactNode }) {
  return <div className="notice error" role="alert">{children}</div>
}
