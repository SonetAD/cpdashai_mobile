import { Slot } from 'expo-router';

export default function RecruiterLayout() {
  // Auth redirects are handled by the root _layout.tsx AuthNavigator
  // This layout just provides the slot for recruiter routes
  return <Slot />;
}
