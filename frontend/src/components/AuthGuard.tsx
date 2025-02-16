import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, getProfile } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!isAuthenticated) {
      getProfile().catch(() => navigate('/login'));
    }
  }, [isAuthenticated, navigate, getProfile]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}