import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import BrowseItems from './pages/BrowseItems';
import ReportItem from './pages/ReportItem';
import ItemDetails from './pages/ItemDetails';
import Dashboard from './pages/Dashboard';
import MyClaims from './pages/MyClaims';
import ModeratorDashboard from './pages/ModeratorDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/items" element={<BrowseItems />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/report" element={<ReportItem />} />
            <Route path="/items/:id/edit" element={<ReportItem />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claims" element={<MyClaims />} />
            <Route element={<ProtectedRoute moderator />}>
              <Route path="/moderator" element={<ModeratorDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
