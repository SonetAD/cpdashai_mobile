import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#437EF4' },
      }}
    >
      {/* Onboarding screens - disable back gesture to prevent going back to login */}
      <Stack.Screen
        name="subscription-gate"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="cv-upload"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
