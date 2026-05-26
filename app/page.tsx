'use client'

import { useActionState } from 'react'
import { signIn } from '@/app/actions/auth'

export default function Home() {
  const [state, formAction, isPending] = useActionState(signIn, null)

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0C0F] relative overflow-hidden">
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(79,142,247,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(124,92,252,0.08)_0%,transparent_60%)]" />

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#161A22] border border-white/10 rounded-2xl p-10">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4F8EF7] to-[#7C5CFC] flex items-center justify-center text-white font-bold text-xl">
            O
          </div>
          <div>
            <div className="text-white font-semibold text-lg leading-tight">OdontoOS</div>
            <div className="text-white/40 text-xs">Sistema Operacional para Clínicas</div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-white text-xl font-semibold mb-1">Bem-vindo de volta</h1>
        <p className="text-white/50 text-sm mb-7">Acesse sua clínica com segurança</p>

        <form action={formAction}>
          {/* Erro */}
          {state?.error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          {/* Campo e-mail */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">✉</span>
            <input
              type="email"
              name="email"
              placeholder="E-mail ou telefone"
              required
              className="w-full h-11 bg-[#0F1117] border border-white/10 rounded-lg pl-9 pr-4 text-white text-sm placeholder-white/30 outline-none focus:border-[#4F8EF7] transition-colors"
            />
          </div>

          {/* Campo senha */}
          <div className="relative mb-5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Senha"
              required
              className="w-full h-11 bg-[#0F1117] border border-white/10 rounded-lg pl-9 pr-10 text-white text-sm placeholder-white/30 outline-none focus:border-[#4F8EF7] transition-colors"
            />
          </div>

          {/* Lembrar + Esqueci */}
          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center gap-2 text-white/50 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#4F8EF7]" />
              Lembrar acesso
            </label>
            <span className="text-[#4F8EF7] cursor-pointer hover:underline">Esqueci a senha</span>
          </div>

          {/* Botão entrar */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold rounded-lg mb-4 hover:opacity-90 transition-opacity text-sm tracking-wide disabled:opacity-50"
          >
            {isPending ? 'Entrando...' : 'Entrar na clínica'}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">ou acesse com</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Botão Google */}
        <button className="w-full h-10 bg-[#1C2130] border border-white/10 rounded-lg text-white/60 text-sm font-medium hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2">
          <span>G</span> Google Workspace
        </button>

        {/* Rodapé */}
        <p className="text-center text-white/30 text-xs mt-6">
          Ao entrar, você concorda com os{" "}
          <span className="text-[#4F8EF7] cursor-pointer">Termos de Uso</span>
          {" "}e a{" "}
          <span className="text-[#4F8EF7] cursor-pointer">Política de Privacidade</span>.
        </p>
      </div>
    </main>
  );
}
