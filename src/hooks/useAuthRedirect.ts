import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../stores/useAuthStore';

const useAuthRedirect = () => {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
};

export default useAuthRedirect;