import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    if (isAuthenticated) {
      navigate('/stories');
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, initAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Loading...</p>
    </div>
  );
}
