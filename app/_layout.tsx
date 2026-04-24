import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'simple_push',
          statusBarStyle: 'light',
          contentStyle: { backgroundColor: '#09161f' },
        }}
      />
    </SafeAreaProvider>
  );
}
