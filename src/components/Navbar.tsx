import React, { useState } from 'react';
import { User } from '../types';
import { Building, LogIn, LogOut, Menu, X, ArrowDownToLine, Bell, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [installed, setInstalled] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Início' },
    { id: 'cadunico', label: 'CadÚnico' },
    { id: 'beneficios', label: 'Consultar Benefícios' },
    { id: 'cursos', label: 'Cursos & Oficinas' },
    { id: 'contrata', label: 'Contrata Vera Cruz' },
    { id: 'unidades', label: 'Unidades SEMPS' },
  ];

  if (user?.role === 'admin') {
    // Add admin dashboard
    menuItems.push({ id: 'admin-dashboard', label: 'Painel Admin' });
  }

  const handleInstallApp = () => {
    alert('🎉 Para instalar o PWA SEMPS VC:\n\n📱 No iOS/Safari: toque em Compartilhar e depois "Adicionar à Tela de Início".\n🤖 No Android/Chrome: toque nos três pontinhos e depois "Instalar Aplicativo".');
    setInstalled(true);
  };

  const mockNotifications = [
    { id: 1, title: 'Mutirão Mar Grande', desc: 'Mutirão de atualização cadastral ativo até sexta-feira.', date: 'Hoje' },
    { id: 2, title: 'Inscrições Abertas', desc: 'Novas vagas para o curso de Informática e Artesanato.', date: 'Ontem' },
    { id: 3, title: 'Benefícios atualizados', desc: 'Confira se seu Auxílio Vera Cruz foi aprovado.', date: '3 dias atrás' }
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white text-brand-green-dark border-b border-brand-green-light/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-brand-green-dark p-2 rounded-lg text-white shadow-sm">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg tracking-tight block text-brand-green-dark">
                SEMPS <span className="font-light text-[#5a5a40]">Vera Cruz</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#5a5a40] block font-semibold leading-none mt-0.5">
                PROMOÇÃO SOCIAL E CIDADANIA
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === item.id
                    ? 'bg-brand-green-dark text-white shadow-sm'
                    : 'text-brand-green-dark/70 hover:bg-brand-green-light/30 hover:text-brand-green-dark'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User Controls / PWA Installation */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Install App */}
            {!installed && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 bg-brand-green-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-brand-green transition shadow-sm"
                title="Instalar como aplicativo de celular"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Instalar App
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-brand-green-dark/80 hover:text-brand-green-dark hover:bg-brand-green-light/30 rounded-full transition relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-green rounded-full border border-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-brand-green-light text-slate-800 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-brand-green-light pb-2 mb-2">
                    <span className="font-display font-bold text-sm text-brand-green-dark">Comunicados Importantes</span>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-brand-green-dark/60 hover:text-brand-green-dark">Fechar</button>
                  </div>
                  <div className="space-y-3">
                    {mockNotifications.map((notif) => (
                      <div key={notif.id} className="border-b border-brand-green-light/20 last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-xs text-brand-green-dark">{notif.title}</span>
                          <span className="text-[10px] text-brand-green-dark/50 font-mono">{notif.date}</span>
                        </div>
                        <p className="text-[11px] text-brand-green-dark/75 leading-normal mt-0.5">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-brand-green-light">
                <div className="text-right">
                  <p className="text-xs font-bold leading-tight truncate max-w-[120px] text-brand-green-dark">{user.name}</p>
                  <p className="text-[10px] text-[#5a5a40] font-mono capitalize">
                    {user.role === 'admin' ? 'Administrador 🛡️' : 'Cidadão'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-brand-green-dark hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                  title="Sair do Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-brand-green-dark text-white hover:bg-brand-green px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrar / Cadastrar
              </button>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Install Button Mobile */}
            {!installed && (
              <button
                onClick={handleInstallApp}
                className="p-2 text-brand-green-dark/80 hover:text-brand-green-dark"
                title="Instalar App"
              >
                <ArrowDownToLine className="w-4 h-4" />
              </button>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-brand-green-dark/80 hover:text-brand-green-dark hover:bg-brand-green-light/30 transition focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-brand-green-light bg-white px-2 pt-2 pb-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition ${
                activeTab === item.id
                  ? 'bg-brand-green-dark text-white shadow-sm'
                  : 'text-brand-green-dark/80 hover:bg-brand-green-light/30'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* User Section in Mobile Menu */}
          <div className="pt-4 mt-4 border-t border-brand-green-light px-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-green-dark">{user.name}</p>
                  <p className="text-[10px] text-[#5a5a40] uppercase tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenAuth(); setIsOpen(false); }}
                className="flex items-center justify-center gap-1.5 w-full bg-brand-green-dark text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                Acessar Minha Conta
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
