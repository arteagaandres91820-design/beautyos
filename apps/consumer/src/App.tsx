import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProfileProvider } from './context/ProfileContext';
import { Splash } from './pages/Splash';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { Routines } from './pages/Routines';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';
import { ProductDetail } from './pages/ProductDetail';
import { RoutineDetail } from './pages/RoutineDetail';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { RoutineBuilder } from './pages/RoutineBuilder';
import { NailAI } from './pages/NailAI';
import { NailTryOn } from './pages/NailTryOn';
import { BookAppointment } from './pages/BookAppointment';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ProfileProvider>
    <CartProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="min-h-dvh bg-primary flex items-start justify-center">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/nail-ai" element={<NailAI />} />
            </Route>
            <Route path="/product/:id" element={
              <div className="phone-shell">
                <ProductDetail />
              </div>
            } />
            <Route path="/routine/:id" element={
              <div className="phone-shell">
                <RoutineDetail />
              </div>
            } />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={
              <div className="phone-shell">
                <OrderSuccess />
              </div>
            } />
            <Route path="/routine-builder" element={
              <div className="phone-shell">
                <RoutineBuilder />
              </div>
            } />
            <Route path="/nail-tryon/:designId" element={<NailTryOn />} />
            <Route path="/book" element={
              <div className="phone-shell">
                <BookAppointment />
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
    </ProfileProvider>
  );
}
