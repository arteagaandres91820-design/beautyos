import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  {
    id: 'home', label: 'Inicio', path: '/home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#083D42' : 'none'} stroke={active ? '#083D42' : '#8A9BA8'} strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'discover', label: 'Descubrir', path: '/discover',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#083D42' : '#8A9BA8'} strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
  // NailAI center tab — rendered separately as a raised FAB
  { id: 'nail-ai', label: 'NailAI', path: '/nail-ai', icon: (_active: boolean) => null },
  {
    id: 'favorites', label: 'Favoritos', path: '/favorites',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#083D42' : 'none'} stroke={active ? '#083D42' : '#8A9BA8'} strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Perfil', path: '/profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#083D42' : '#8A9BA8'} strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="phone-shell flex flex-col">
      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom navigation */}
      <nav className="shrink-0 bg-white border-t border-gray-100 px-2 pt-2 relative" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-around">
          {TABS.map(tab => {
            const active = pathname === tab.path || pathname.startsWith('/nail-tryon') && tab.id === 'nail-ai';

            // NailAI center FAB
            if (tab.id === 'nail-ai') {
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-0.5 -mt-5 active:scale-90 transition-transform"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-btn transition-all ${
                      active ? 'bg-primary scale-110' : 'bg-primary'
                    }`}
                    style={{ boxShadow: '0 4px 20px rgba(8,61,66,0.35)' }}
                  >
                    {/* Nail / sparkle icon */}
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
                      <path d="M12 2C8.5 2 6 4.5 6 7.5c0 1.8.9 3.3 2.2 4.3L5 22h14l-3.2-10.2C17.1 10.8 18 9.3 18 7.5 18 4.5 15.5 2 12 2z" />
                      <path d="M9 7.5c0-1.7 1.3-3 3-3" strokeLinecap="round" />
                      <path d="M12 14v4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-primary' : 'text-primary/70'}`}>
                    NailAI
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all active:scale-90"
              >
                {tab.icon(active)}
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

