import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, Download, Check, RefreshCw, Copy, Chrome, Info } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installState, setInstallState] = useState<'idle' | 'prompting' | 'installed' | 'not-supported'>('idle');

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setInstallState('installed');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallState('idle');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect platform to set default tab
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      // No prompt available, maybe because it's running inside an iframe, or not supported on this browser
      // Show manual install warning
      alert('Seu navegador não suporta a instalação direta em um clique por estar em um ambiente restrito (como iframe). Siga as instruções passo a passo abaixo para instalar no seu aparelho!');
      return;
    }

    setInstallState('prompting');
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('installed');
        // Save installed status in localStorage
        localStorage.setItem('pwa-installed', 'true');
      } else {
        setInstallState('idle');
      }
    } catch (err) {
      console.error('Error during PWA installation:', err);
      setInstallState('idle');
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="pwa-install-modal">
      <div className="bg-white rounded-[32px] border border-brand-green-light max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="p-6 bg-brand-green-dark text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-brand-green/30 p-2.5 rounded-2xl text-brand-green-light">
              <Smartphone className="w-6 h-6 text-brand-green-light" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Instalar Aplicativo SEMPS</h3>
              <p className="text-xs text-brand-cream-dark font-light mt-0.5">Vera Cruz na palma da sua mão!</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-green-light/40 bg-brand-cream/30">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'android' 
                ? 'border-brand-green text-brand-green-dark bg-white' 
                : 'border-transparent text-[#5a5a40]/60 hover:text-brand-green-dark hover:bg-brand-cream/50'
            }`}
          >
            🤖 Android
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'ios' 
                ? 'border-brand-green text-brand-green-dark bg-white' 
                : 'border-transparent text-[#5a5a40]/60 hover:text-brand-green-dark hover:bg-brand-cream/50'
            }`}
          >
            🍎 iPhone / iOS
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'desktop' 
                ? 'border-brand-green text-brand-green-dark bg-white' 
                : 'border-transparent text-[#5a5a40]/60 hover:text-brand-green-dark hover:bg-brand-cream/50'
            }`}
          >
            💻 Computador
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Native Promo/Button */}
          {deferredPrompt ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-emerald-900 flex items-center justify-center sm:justify-start gap-1">
                  ✨ Instalação Simplificada Disponível!
                </p>
                <p className="text-[10px] text-emerald-850 mt-0.5 font-light">Seu navegador suporta a instalação com apenas um clique.</p>
              </div>
              <button
                onClick={handleNativeInstall}
                className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" /> Instalar Agora
              </button>
            </div>
          ) : (
            <div className="p-3 bg-brand-cream/40 border border-brand-green-light/40 rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#5a5a40] leading-relaxed font-light">
                Para um funcionamento ideal no ambiente do AI Studio, recomendamos abrir a aplicação em uma aba cheia ou no seu próprio navegador móvel antes de prosseguir com a instalação.
              </p>
            </div>
          )}

          {/* Interactive Steps by OS */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs text-brand-green-dark uppercase tracking-wider">Passo a Passo de Instalação:</h4>

            {activeTab === 'android' && (
              <div className="space-y-3 text-xs text-[#5a5a40]">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Abra no Google Chrome</p>
                    <p className="text-[11px] font-light mt-0.5">Certifique-se de que está acessando este portal pelo navegador Google Chrome no seu celular.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Acesse o Menu de Opções</p>
                    <p className="text-[11px] font-light mt-0.5">Toque no ícone de <strong>três pontinhos (⋮)</strong> no canto superior direito da tela do Chrome.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Adicione à Tela Inicial</p>
                    <p className="text-[11px] font-light mt-0.5">Toque na opção <strong>"Instalar Aplicativo"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs text-[#5a5a40]">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Abra no Safari</p>
                    <p className="text-[11px] font-light mt-0.5">No iPhone ou iPad, você deve usar o navegador nativo **Safari** para poder instalar o aplicativo.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Toque em Compartilhar</p>
                    <p className="text-[11px] font-light mt-0.5">Toque no botão **Compartilhar** (o ícone de quadrado com uma seta para cima na barra inferior).</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Adicione à Tela de Início</p>
                    <p className="text-[11px] font-light mt-0.5">Role as opções para baixo e toque em **"Adicionar à Tela de Início"**, depois toque em "Adicionar" no canto superior.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3 text-xs text-[#5a5a40]">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Verifique a Barra de Endereço</p>
                    <p className="text-[11px] font-light mt-0.5">No Google Chrome ou Microsoft Edge no computador, olhe para o lado direito da barra de endereço.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Clique no ícone de Computador</p>
                    <p className="text-[11px] font-light mt-0.5">Clique no ícone de <strong>computador com uma seta de download (⊕)</strong> que aparece ao lado do ícone de estrela de favoritos.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-green-light/40 flex items-center justify-center font-bold text-[10px] text-brand-green-dark shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-brand-green-dark">Confirme a Instalação</p>
                    <p className="text-[11px] font-light mt-0.5">Clique em <strong>"Instalar"</strong> na janelinha que aparecer. O app abrirá imediatamente em uma janela limpa e dedicada.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-600 rounded-full text-white shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-900">Aplicativo Leve e Seguro</p>
              <p className="text-[9px] text-emerald-800 leading-normal font-light">Este app não consome espaço no seu armazenamento, é atualizado automaticamente e protege sua privacidade.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-xs"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
