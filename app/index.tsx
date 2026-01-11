import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store';

export default function Index() {
  const session = useAppStore((state) => state.session);

  if (session) {
    return <Redirect href="/discovery" />;
  }

  return <Redirect href="/auth" />;
}
