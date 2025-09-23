export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-md p-6">{children}</main>;
}