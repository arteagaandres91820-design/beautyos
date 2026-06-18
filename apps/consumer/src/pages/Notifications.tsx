import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'order' | 'promo' | 'points' | 'routine' | 'tip';
  title: string;
  body: string;
  time: string;
  read: boolean;
  emoji: string;
  action?: { label: string; path: string };
}

const INITIAL: Notification[] = [
  {
    id: '1', type: 'order', emoji: '📦',
    title: 'Tu pedido está en camino',
    body: 'BOS-28341 salió de bodega. Llega hoy entre 2–5 PM.',
    time: 'hace 1 hora', read: false,
    action: { label: 'Rastrear pedido', path: '/profile' },
  },
  {
    id: '2', type: 'promo', emoji: '⚡',
    title: 'Oferta del día: 30% off Sérum',
    body: 'Solo hoy hasta las 11:59 PM. ¡Aprovecha el descuento más grande del mes!',
    time: 'hace 3 horas', read: false,
    action: { label: 'Ver oferta', path: '/product/1' },
  },
  {
    id: '3', type: 'points', emoji: '✦',
    title: '¡Ganaste 120 puntos!',
    body: 'Tu compra del Sérum Renovador Glow+ sumó 120 puntos a tu cuenta.',
    time: 'ayer', read: true,
    action: { label: 'Ver mis puntos', path: '/profile' },
  },
  {
    id: '4', type: 'routine', emoji: '🌟',
    title: '¡Llevas 5 días seguidos!',
    body: 'Tu racha de rutina sigue en marcha. ¡Completa hoy y consigue tu recompensa!',
    time: 'ayer', read: true,
    action: { label: 'Ver rutinas', path: '/routines' },
  },
  {
    id: '5', type: 'tip', emoji: '💡',
    title: 'Tip para piel mixta',
    body: 'Usa el tónico balanceador en la zona T antes del sérum para mejores resultados.',
    time: 'hace 2 días', read: true,
  },
  {
    id: '6', type: 'promo', emoji: '🎁',
    title: 'Nuevo kit disponible',
    body: 'El Kit Glow Completo ya está en stock. Incluye 5 productos con 20% de descuento.',
    time: 'hace 3 días', read: true,
    action: { label: 'Ver kit', path: '/discover' },
  },
];

const TYPE_COLOR: Record<string, string> = {
  order:   'bg-blue-50 text-blue-600',
  promo:   'bg-amber-50 text-amber-600',
  points:  'bg-primary-50 text-primary',
  routine: 'bg-emerald-50 text-emerald-600',
  tip:     'bg-purple-50 text-purple-600',
};

export function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleAction = (notif: Notification) => {
    markRead(notif.id);
    if (notif.action) navigate(notif.action.path);
  };

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-light text-dark">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted">{unreadCount} sin leer</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary font-medium active:opacity-60 transition-opacity">
              Marcar todas leídas
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
        {notifs.map(notif => (
          <div
            key={notif.id}
            onClick={() => markRead(notif.id)}
            className={`card p-4 transition-all duration-200 ${!notif.read ? 'border-l-4 border-l-primary' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-lg ${TYPE_COLOR[notif.type] || 'bg-gray-100'}`}>
                {notif.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-dark' : 'font-medium text-dark/80'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <span className="text-[10px] text-muted whitespace-nowrap">{notif.time}</span>
                  </div>
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">{notif.body}</p>

                {notif.action && (
                  <button
                    onClick={e => { e.stopPropagation(); handleAction(notif); }}
                    className="mt-2 text-xs font-semibold text-primary bg-primary-50 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                  >
                    {notif.action.label} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

