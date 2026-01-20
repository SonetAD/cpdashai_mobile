import { useLocalSearchParams, Redirect } from 'expo-router';

// Redirect to the cv-builder outside tabs (no navbar)
export default function CVBuilderRedirect() {
  const { resumeId } = useLocalSearchParams<{ resumeId?: string }>();

  // Build the redirect URL with query params
  const redirectUrl = resumeId
    ? `/(candidate)/cv-builder?resumeId=${resumeId}&source=jobs`
    : '/(candidate)/cv-builder?source=jobs';

  return <Redirect href={redirectUrl as any} />;
}
