import { Redirect, Slot } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function RecruiterLayout() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  // Redirect candidates to their dashboard
  if (user?.role !== 'recruiter') {
    return <Redirect href="/(candidate)/(tabs)/home" />;
  }

  return <Slot />;
}
