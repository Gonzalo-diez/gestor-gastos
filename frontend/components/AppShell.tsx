"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const nav = [
  { href: '/', label: 'Resumen' },
  { href: '/transactions', label: 'Transacciones' },
  { href: '/transactions/imports', label: 'Importar' },
  { href: '/accounts', label: 'Cuentas' },
  { href: '/categories', label: 'Categorías' },
  { href: '/budgets', label: 'Presupuestos' },
  { href: '/reports', label: 'Reportes' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <div className="min-h-dvh bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <button onClick={()=>setOpen(true)} className="sm:hidden rounded p-2 border" aria-label="Abrir menú">☰</button>
          <Link href="/" className="font-semibold">Gestor</Link>
          <nav className="ml-auto hidden sm:flex gap-2">
            {nav.map(i=>(
              <Link key={i.href} href={i.href}
                className={`px-3 py-1 rounded ${path===i.href?'bg-black text-white':'hover:bg-gray-100'}`}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Drawer móvil */}
      <div className={`fixed inset-0 z-40 sm:hidden ${open?'':'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/30 transition-opacity ${open?'opacity-100':'opacity-0'}`} onClick={()=>setOpen(false)} />
        <nav className={`absolute left-0 top-0 h-full w-72 bg-white shadow-lg p-4 transition-transform ${open?'translate-x-0':'-translate-x-full'}`}>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold">Menú</span>
            <button onClick={()=>setOpen(false)} className="p-2">✕</button>
          </div>
          <ul className="grid gap-1">
            {nav.map(i=>(
              <li key={i.href}>
                <Link href={i.href} onClick={()=>setOpen(false)}
                  className={`block rounded px-3 py-2 ${path===i.href?'bg-black text-white':'hover:bg-gray-100'}`}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-4">{children}</main>
    </div>
  );
}
