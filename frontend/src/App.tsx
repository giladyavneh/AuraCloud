import { Routes, Route, Navigate } from 'react-router-dom';
import PageWrapper from '@/layouts/pageWrapper/PageWrapper';
import Dashboard from '@/pages/dashboard/Dashboard';
import ResourceWatchlist from '@/pages/resourceWatchlist/ResourceWatchlist';

const App = () => (
  <Routes>
    <Route element={<PageWrapper />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/resource-watch-list" element={<ResourceWatchlist />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
);

export default App;
