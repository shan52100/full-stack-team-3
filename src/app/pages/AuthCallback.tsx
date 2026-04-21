import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    loginWithToken(token)
      .then(() => {
        toast.success('Signed in with Google!');
        navigate('/dashboard');
      })
      .catch(() => {
        toast.error('Failed to complete sign-in.');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
