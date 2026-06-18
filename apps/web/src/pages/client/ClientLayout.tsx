import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Compass, Sparkles, Heart, User, Download, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { publicApi } from '../../lib/api';
import { useFavorites } from '../../hooks/useFavorites';

const TABS = [
  { to: '/cliente',          label: 'Inicio',    Icon: Home,      end: true,  badge: 'proposal' },
  { to: '/cliente/descubrir',label: 'Descubrir', Icon: Compass,   end: false, badge: null },
  { to: '/cliente/rutinas',  label: 'Rutinas',   Icon: Sparkles,  end: false, badge: null },
  { to: '/cliente/favoritos',label: 'Favoritos', Icon: Heart,     end: false, badge: 'favs' },
  { to: '/cliente/perfil',   label: 'Perfil',    Icon: User,      end: false, badge: null },
] as const;

export function ClientLayout() {
  const clientToken = localStorage.getItem('beautyos_client_token');
  const { count: favCount } = useFavorites();

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('beautyos_pwa_dismissed');
    if (dismissed) return;
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    localStorage.setItem('beautyos_pwa_dismissed', '1');
    setShowInstall(false);
  };

  const { data: proposal } = useQuery({
    queryKey: ['client-layout-proposal', clientToken],
    queryFn: () => publicApi.getProposal(clientToken!).then(r => r.data),
    enabled: !!clientToken,
    retry: false,
    staleTime: 60_000,
  });

  const hasPendingProposal = !!proposal && !proposal.approvedDesignId;

  return (
    <div className="min-h-screen bg-[#E8EDEB] font-body flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative bg-[#EFF4F1] shadow-2xl">
        {/* PWA install banner */}
        {showInstall && (
          <div className="bg-[#083D42] px-4 py-3 flex items-center gap-3 animate-slide-down shadow-[0_4px_20px_rgba(8,61,66,0.3)]">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-snug">Agrega BeautyOS a tu inicio</p>
              <p className="text-white/70 text-[10px] mt-0.5">Accede más rápido sin abrir el navegador</p>
            </div>
            <button onClick={handleInstall}
              className="bg-white text-[#083D42] text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition-transform">
              Instalar
            </button>
            <button onClick={dismissInstall} className="text-white/70 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/96 backdrop-blur-xl border-t border-gray-100/80 z-50 px-1 pt-2 pb-safe shadow-[0_-1px_24px_rgba(13,92,99,0.07)]" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-around">
            {TABS.map(({ to, label, Icon, end, badge }) => {
              const dot = badge === 'proposal' ? hasPendingProposal
                : badge === 'favs' ? favCount > 0
                : false;
              const dotCount = badge === 'favs' ? favCount : null;

              return (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn(
                    'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px]',
                    isActive ? 'text-[#083D42]' : 'text-gray-400 hover:text-[#083D42]/50'
                  )}>
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 1.7} />
                        {dot && (
                          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-[#083D42] rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                            {dotCount ?? ''}
                          </span>
                        )}
                      </div>
                      <span className={cn('text-[10px] font-semibold leading-none tracking-tight', isActive ? 'text-[#083D42]' : 'text-gray-400')}>
                        {label}
                      </span>
                      {isActive && <div className="w-1 h-1 rounded-full bg-[#2DC7B3] mt-0.5" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
