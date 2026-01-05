import { Stack } from 'expo-router';

export default function AICoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="clara-assistant" />
      <Stack.Screen name="session/[sessionId]" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="results/[sessionId]" />
    </Stack>
  );
}
