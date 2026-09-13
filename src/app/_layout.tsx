import { AuthProvider } from '@/context/auth-context';
import { TodosProvider } from '@/context/todos-context';
import '@/utils/notifications';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TodosProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-todo"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="edit-todo"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </TodosProvider>
    </AuthProvider>
  );
}

