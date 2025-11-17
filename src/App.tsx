import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StoriesPage from './pages/StoriesPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ReadStoryPage from './pages/ReadStoryPage';
import SessionDetailsPage from './pages/SessionDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/read/:id" element={<ReadStoryPage />} />
        <Route path="/sessions/:id" element={<SessionDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
