import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[jobId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="application-tracker" />
      <Stack.Screen name="cv-upload" />
      <Stack.Screen name="cv-builder" />
    </Stack>
  );
}
