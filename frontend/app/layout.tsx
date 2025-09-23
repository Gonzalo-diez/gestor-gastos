import './globals.css';
import AppShell from '@/components/AppShell';
import Providers from './providers'; // tu QueryClientProvider/Toaster, etc.

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="es"><body>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </body></html>
  );
}
