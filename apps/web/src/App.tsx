import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Agenda } from './pages/Agenda';
import { Services } from './pages/Services';
import { Cash } from './pages/Cash';
import { NailAI } from './pages/NailAI';
import { Settings } from './pages/Settings';
import { Staff } from './pages/Staff';
import { Reports } from './pages/Reports';
import { Campaigns } from './pages/Campaigns';
import { Packages } from './pages/Packages';
import { Expenses } from './pages/Expenses';
import { GiftCards } from './pages/GiftCards';
import { Inventory } from './pages/Inventory';
import KioskTryOn from './pages/KioskTryOn';
import { Landing } from './pages/Landing';
import { ClientLayout } from './pages/client/ClientLayout';
import { ClientOnboarding } from './pages/client/ClientOnboarding';
import { ClientHome } from './pages/client/ClientHome';
import { ClientDiscover } from './pages/client/ClientDiscover';
import { ClientApproval } from './pages/client/ClientApproval';
import { ClientProfile } from './pages/client/ClientProfile';
import { ClientFavorites } from './pages/client/ClientFavorites';
import { ClientRutinas } from './pages/client/ClientRutinas';
import { ClientBooking } from './pages/client/ClientBooking';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted mt-3">Cargando BeautyOS…</p>
      </div>
    </div>
  );
  if (!user) return <Landing />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/landing"  element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/try-on"   element={<KioskTryOn />} />

      {/* ── Client app (public, no auth) ── */}
      <Route path="/cliente/bienvenida"  element={<ClientOnboarding />} />
      <Route path="/cliente/aprobar/:token" element={<ClientApproval />} />
      <Route path="/cliente/agendar"    element={<ClientBooking />} />
      <Route path="/cliente" element={<ClientLayout />}>
        <Route index         element={<ClientHome />} />
        <Route path="home"   element={<ClientHome />} />
        <Route path="descubrir" element={<ClientDiscover />} />
        <Route path="rutinas"   element={<ClientRutinas />} />
        <Route path="favoritos" element={<ClientFavorites />} />
        <Route path="perfil"    element={<ClientProfile />} />
      </Route>

      {/* ── Admin dashboard (protected) ── */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index            element={<Dashboard />} />
        <Route path="clients"   element={<Clients />} />
        <Route path="agenda"    element={<Agenda />} />
        <Route path="services"  element={<Services />} />
        <Route path="cash"      element={<Cash />} />
        <Route path="nail-ai"   element={<NailAI />} />
        <Route path="staff"     element={<Staff />} />
        <Route path="reports"   element={<Reports />} />
        <Route path="campaigns" element={<Campaigns />} />
<Route path="packages"  element={<Packages />} />
        <Route path="expenses"   element={<Expenses />} />
        <Route path="gift-cards" element={<GiftCards />} />
        <Route path="inventory"  element={<Inventory />} />
        <Route path="settings"  element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
