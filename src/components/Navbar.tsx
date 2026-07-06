import React, { useState, useEffect } from 'react';
import { User, SystemNotification } from '../types';
import { Building, LogIn, LogOut, Menu, X, ArrowDownToLine, Bell, ShieldAlert, Check } from 'lucide-react';
import { notificationsService } from '../services/firestoreService';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPwa: () => void;
}

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab, onOpenPwa }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    // Check if running as PWA or was installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || localStorage.getItem('pwa-installed') === 'true';
    if (isStandalone) {
      setInstalled(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const unsub = notificationsService.subscribeNotifications(user.id, user.role, (data) => {
      setNotifications(data);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = user ? notifications.filter(n => !n.readBy?.includes(user.id)).length : 0;

  let menuItems: { id: string; label: string }[] = [];
  const isAdminOrColab = user?.role === 'admin' || user?.role === 'administrador' || user?.role === 'colaborador';

  if (isAdminOrColab) {
    menuItems = [
      { id: 'admin-dashboard', label: user?.role === 'colaborador' ? 'Painel de Gestão' : 'Painel Administrativo' }
    ];
  } else {
    menuItems = [
      { id: 'home', label: 'Início' },
      { id: 'cadunico', label: 'CadÚnico' },
      { id: 'beneficios', label: 'Consultar Benefícios' },
      { id: 'cursos', label: 'Cursos & Oficinas' },
      { id: 'contrata', label: 'Contrata Vera Cruz' },
      { id: 'unidades', label: 'Unidades SEMPS' },
    ];
  }

  const handleMarkAllRead = () => {
    if (!user) return;
    notifications.forEach(n => {
      if (!n.readBy?.includes(user.id)) {
        notificationsService.markAsRead(n.id, user.id);
      }
    });
  };

  const handleInstallApp = () => {
    onOpenPwa();
  };

  return (
    <nav className="sticky top-0 z-40 bg-white text-brand-green-dark border-b border-brand-green-light/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(isAdminOrColab ? 'admin-dashboard' : 'home')}>
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
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-brand-green-light text-slate-800 p-4 z-50 animate-fade-in max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-brand-green-light pb-2 mb-2">
                    <span className="font-display font-bold text-sm text-brand-green-dark">Notificações ({notifications.length})</span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-[10px] text-brand-green font-bold hover:underline flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Ler todas
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-xs text-brand-green-dark/60 hover:text-brand-green-dark">Fechar</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhuma notificação recebida.</p>
                    ) : (
                      notifications.map((notif) => {
                        const isRead = user ? notif.readBy?.includes(user.id) : true;
                        return (
                          <div key={notif.id} className={`pb-2 border-b border-slate-100 last:border-0 ${!isRead ? 'bg-brand-green-light/10 p-1.5 rounded-lg' : ''}`}>
                            <div className="flex justify-between items-start gap-1">
                              <span className={`font-bold text-xs ${!isRead ? 'text-brand-green-dark' : 'text-slate-700'}`}>{notif.title}</span>
                              <span className="text-[8px] text-slate-400 font-mono">
                                {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal mt-0.5">{notif.message}</p>
                          </div>
                        );
                      })
                    )}
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
                    {(user.role === 'admin' || user.role === 'administrador') ? 'Administrador 🛡️' : user.role === 'colaborador' ? 'Colaborador 💼' : 'Cidadão'}
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
                  <p className="text-[10px] text-[#5a5a40] uppercase tracking-wider">
                    {(user.role === 'admin' || user.role === 'administrador') ? 'Administrador 🛡️' : user.role === 'colaborador' ? 'Colaborador 💼' : 'Cidadão'}
                  </p>
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
