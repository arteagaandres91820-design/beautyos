import { useNavigate } from 'react-router-dom';
import { USER_NAME } from '../data/mock';

const SKIN_TYPES = ['Normal', 'Mixta', 'Grasa', 'Seca', 'Sensible'];
const SKIN_CONCERNS = ['Hidratación', 'Manchas', 'Poros', 'Acné', 'Envejecimiento', 'Luminosidad'];

const MENU_ITEMS = [
  { icon: '📦', label: 'Mis pedidos', count: 2 },
  { icon: '📍', label: 'Direcciones de entrega', count: null },
  { icon: '💳', label: 'Métodos de pago', count: null },
  { icon: '🔔', label: 'Notificaciones', count: 3 },
  { icon: '⭐', label: 'Mis reseñas', count: 5 },
  { icon: '🎁', label: 'Referidos y descuentos', count: null },
  { icon: '❓', label: 'Ayuda', count: null },
];

export function Profile() {
  const navigate = useNavigate();

  return (
    <div className="page-enter pb-4">
      <div className="px-5 pt-12">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-200 to-primary-500 flex items-center justify-center text-white font-display text-2xl font-light shadow-card">
            {USER_NAME[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-light text-dark">{USER_NAME} ✦</h2>
            <p className="text-sm text-muted">valeria@email.com</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">★</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-600">Gold Member</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[['$1.247', 'Gastado'], ['4', 'Pedidos'], ['12', 'Reseñas']].map(([val, label]) => (
            <div key={label} className="card p-3 text-center">
              <p className="font-display text-xl font-medium text-primary">{val}</p>
              <p className="text-[10px] text-muted font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Skin profile */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-dark text-sm">Mi tipo de piel</p>
            <button className="text-xs text-primary font-medium">Editar</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {SKIN_TYPES.map(t => (
              <span key={t}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-all ${t === 'Mixta' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-muted'}`}>
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted font-medium mb-2">Preocupaciones</p>
          <div className="flex flex-wrap gap-1.5">
            {SKIN_CONCERNS.map(c => (
              <span key={c}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${['Hidratación', 'Luminosidad'].includes(c) ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-muted'}`}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="card divide-y divide-gray-50 mb-6">
          {MENU_ITEMS.map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 p-4 text-left active:bg-primary-50 transition-colors">
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-dark">{item.label}</span>
              {item.count != null && (
                <span className="text-[10px] font-bold text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center">{item.count}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-rose-500 bg-rose-50 active:scale-95 transition-transform mb-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
