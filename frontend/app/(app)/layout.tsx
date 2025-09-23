import RequireAuth from '@/components/RequireAuth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh grid grid-rows-[auto_1fr]">
        <main className="mx-auto max-w-6xl w-full px-4 py-6">{children}</main>
      </div>
    </RequireAuth>
  );
}