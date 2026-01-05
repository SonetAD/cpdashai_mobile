import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../../../store/slices/authSlice';
import { api } from '../../../../services/api';
import { clearTokens } from '../../../../utils/authUtils';
import RecruiterProfileScreen from '../../../../screens/recruiter/profile/ProfileScreen';

export default function RecruiterProfileRoute() {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await clearTokens();
    dispatch(logoutAction());
    dispatch(api.util.resetApiState());
  };

  return <RecruiterProfileScreen onLogout={handleLogout} />;
}
