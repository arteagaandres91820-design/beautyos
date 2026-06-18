import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, CalendarPlus, Sparkles, X, Cake } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import { DashboardStats } from '../types';
import { cn } from '../lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/clients':    'Clientes',
  '/agenda':     'Agenda',
  '/services':   'Servicios',
  '/cash':       'Caja',
  '/nail-ai':    'NailAI Studio',
  '/staff':      'Equipo',
  '/reports':    'Reportes',
'/packages':   'Paquetes',
  '/expenses':   'Gastos',
  '/gift-cards': 'Gift Cards',
  '/campaigns':  'Campañas',
  '/settings':   'Ajustes',
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const alertCount = (stats?.pendingBookingRequests ?? 0) + (stats?.pendingProposals ?? 0) +
    (stats?.birthdayClients?.length ?? 0);
  const title = PAGE_TITLES[location.pathname] ?? 'BeautyOS';
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl animate-slide-in-left">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-edge px-4 sm:px-6 h-14 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-surface text-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-lg text-ink truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell with dropdown */}
            <div ref={bellRef} className="relative">
              <button onClick={() => setBellOpen(v => !v)}
                className="p-1.5 rounded-lg hover:bg-surface text-muted relative">
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-edge z-50 overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
                    <p className="font-semibold text-sm text-gray-800">Notificaciones</p>
                    <button onClick={() => setBellOpen(false)} className="text-muted hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {alertCount === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Sin notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-edge">
                      {(stats?.pendingBookingRequests ?? 0) > 0 && (
                        <button onClick={() => { navigate('/agenda'); setBellOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <CalendarPlus className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {stats!.pendingBookingRequests} solicitud{stats!.pendingBookingRequests !== 1 ? 'es' : ''} nueva{stats!.pendingBookingRequests !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Clientes esperando confirmación de cita</p>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                            {stats!.pendingBookingRequests}
                          </span>
                        </button>
                      )}
                      {(stats?.pendingProposals ?? 0) > 0 && (
                        <button onClick={() => { navigate('/agenda'); setBellOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {stats!.pendingProposals} propuesta{stats!.pendingProposals !== 1 ? 's' : ''} sin respuesta
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Diseños enviados, esperando aprobación</p>
                          </div>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-primary/10 text-primary')}>
                            {stats!.pendingProposals}
                          </span>
                        </button>
                      )}
                      {(stats?.birthdayClients?.length ?? 0) > 0 && (
                        <button onClick={() => { navigate('/clients'); setBellOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left">
                          <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Cake className="w-4 h-4 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {stats!.birthdayClients.length === 1
                                ? `¡Hoy es el cumpleaños de ${stats!.birthdayClients[0].name.split(' ')[0]}!`
                                : `${stats!.birthdayClients.length} clientes cumplen años hoy`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {stats!.birthdayClients.slice(0, 2).map(c => c.name.split(' ')[0]).join(', ')}
                              {stats!.birthdayClients.length > 2 ? ` y ${stats!.birthdayClients.length - 2} más` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full shrink-0">
                            🎂
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="px-4 py-2.5 border-t border-edge">
                    <button onClick={() => { navigate('/agenda'); setBellOpen(false); }}
                      className="text-xs text-primary font-semibold hover:underline">
                      Ver agenda completa →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-7 h-7 rounded-full bg-[#083D42] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
