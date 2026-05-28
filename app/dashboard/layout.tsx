"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

const menuItems = [
  { icon: "⊞", label: "Dashboard", href: "/dashboard" },
  { icon: "📅", label: "Agenda", href: "/dashboard/agenda" },
  { icon: "👥", label: "Pacientes", href: "/dashboard/pacientes" },
  { icon: "🦷", label: "Procedimentos", href: "/dashboard/procedimentos" },
  { icon: "📋", label: "Prontuário", href: "/dashboard/prontuario" },
  { icon: "💰", label: "Financeiro", href: "/dashboard/financeiro" },
  { icon: "📄", label: "Orçamentos", href: "/dashboard/orcamentos" },
  { icon: "💬", label: "Comunicação", href: "/dashboard/comunicacao" },
  { icon: "✅", label: "Tarefas", href: "/dashboard/tarefas" },
  { icon: "📊", label: "Relatórios", href: "/dashboard/relatorios" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 bg-[#181C24] border-r border-white/5
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F8EF7] to-[#7C5CFC] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            O
          </div>
          <div>
            <div className="text-white font-semibold text-sm">OdontoOS</div>
            <div className="text-white/40 text-xs">Sistema Operacional</div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
            Principal
          </div>
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${active
                    ? "bg-[#4F8EF7]/10 text-[#4F8EF7] font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Usuário */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#7C5CFC] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              AL
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">Dra. Ana Lima</div>
              <div className="text-white/40 text-xs truncate">admin</div>
            </div>
            <form action={signOut}>
              <button type="submit" className="text-white/30 hover:text-white text-xs transition-colors">
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#13161C]">

        {/* HEADER */}
        <header className="h-14 bg-[#181C24] border-b border-white/5 flex items-center px-4 gap-4 flex-shrink-0">
          {/* Botão menu mobile */}
          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          {/* Busca */}
          <div className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 h-8">
              <span className="text-white/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar paciente..."
                className="bg-transparent text-white text-xs placeholder-white/30 outline-none w-full"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm">
              🔔
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-xs font-semibold px-3 h-8 rounded-lg hover:opacity-90 transition-opacity">
              + Agendar
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#7C5CFC] flex items-center justify-center text-xs font-bold text-white">
              AL
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#13161C]">
          {children}
        </main>
      </div>

      {/* TAB BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#181C24] border-t border-white/5 flex items-center justify-around px-2 py-2 z-10">
        {menuItems.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                active ? "text-[#4F8EF7]" : "text-white/40"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
