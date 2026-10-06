import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/Auth';
import { LiveProvider } from './context/Live';
import { DataProvider } from './context/Data';
import Shell from './components/Shell';
import Login from './pages/Login';
import MapPage from './pages/MapPage';

const Apiaries = lazy(() => import('./pages/Apiaries'));
const Hives = lazy(() => import('./pages/Hives'));
const HiveDetail = lazy(() => import('./pages/HiveDetail'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Control = lazy(() => import('./pages/Control'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="empty" style={{ minHeight: '100vh' }}><div className="skeleton" style={{ width: 200, height: 16 }} /></div>;
  if (!user) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  return (
    <LiveProvider>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route element={<Shell />}>
            <Route index element={<MapPage />} />
            <Route path="apiaries" element={<Apiaries />} />
            <Route path="hives" element={<Hives />} />
            <Route path="hives/:id" element={<HiveDetail />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="control" element={<Control />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </DataProvider>
    </LiveProvider>
  );
}
