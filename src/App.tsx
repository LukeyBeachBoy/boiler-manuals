import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ManufacturerDetailPage } from './pages/ManufacturerDetail';
import { ModelDetailPage } from './pages/ModelDetail';

export default function App() {
  return (
    <BrowserRouter basename="/boiler-manuals">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/manufacturer/:id" element={<ManufacturerDetailPage />} />
          <Route path="/model/:id" element={<ModelDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
