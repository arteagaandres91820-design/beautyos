import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, CalendarDays, Scissors, DollarSign, Sparkles, LogOut, Crown, Settings, Users2, BarChart2, Megaphone, Package2, Receipt, Gift, PackageSearch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import { cn } from '../lib/utils';

const links = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { to: '/clients',  label: 'Clientes',  icon: Users,           badge: null },
  { to: '/agenda',   label: 'Agenda',    icon: CalendarDays,    badge: 'pending' },
  { to: '/services', label: 'Servicios', icon: Scissors,        badge: null },
  { to: '/cash',     label: 'Caja',      icon: DollarSign,      badge: null },
  { to: '/nail-ai',  label: 'NailAI',    icon: Sparkles,        badge: 'ia' },
  { to: '/staff',    label: 'Equipo',    icon: Users2,          badge: null },
  { to: '/reports',   label: 'Reportes',   icon: BarChart2,  badge: null },
{ to: '/packages',  label: 'Paquetes',   icon: Package2,   badge: null },
  { to: '/expenses',   label: 'Gastos',      icon: Receipt,       badge: null },
  { to: '/gift-cards', label: 'Gift Cards',  icon: Gift,          badge: null },
  { to: '/inventory',  label: 'Inventario',  icon: PackageSearch, badge: null },
  { to: '/campaigns',  label: 'Campañas',    icon: Megaphone,     badge: null },
] as const;

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const pendingCount = (stats?.pendingBookingRequests ?? 0) + (stats?.pendingProposals ?? 0);

  return (
    <aside className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#083D42] flex items-center justify-center shadow-[0_4px_16px_rgba(8,61,66,0.4)] shrink-0">
            {/* SinergIA bar-chart icon */}
            <svg viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="15" width="4" height="6"  rx="1.2" fill="#fff" opacity="0.45"/>
              <rect x="6.5" y="11" width="4" height="10" rx="1.2" fill="#fff" opacity="0.65"/>
              <rect x="12" y="6.5" width="4" height="14.5" rx="1.2" fill="#fff" opacity="0.82"/>
              <rect x="17.5" y="2" width="3.5" height="19" rx="1.2" fill="#fff"/>
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-base text-white leading-tight">
              Beauty<span className="text-primary">OS</span>
            </div>
            <div className="text-[11px] text-[#c5d0df]/70 leading-tight">
              {user?.business?.name ?? 'SinergIA'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-3 pt-1 pb-1.5">Principal</p>
        {links.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
            {label}
            {badge === 'ia' && (
              <span className="ml-auto px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">IA</span>
            )}
            {badge === 'pending' && pendingCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-amber-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2.5 pb-2">
        <NavLink to="/settings" onClick={onClose}
          className={({ isActive }) => cn('sidebar-link', isActive && 'active')}>
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          Ajustes
        </NavLink>
      </div>

      {/* User footer */}
      <div className="px-2.5 pb-4 pt-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#083D42] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {user?.role === 'ADMIN' && <Crown className="w-3 h-3 text-amber-400" />}
              <p className="text-xs text-[#c5d0df]/60">{user?.role === 'ADMIN' ? 'Admin' : 'Profesional'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#c5d0df]/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
