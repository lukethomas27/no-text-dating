import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppStore } from '../src/store';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  const { initialize, isLoading, isInitialized } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.backgroundSecondary,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="discovery" options={{ title: 'Discover', headerShown: false }} />
        <Stack.Screen 
          name="profile/edit" 
          options={{ 
            title: 'Edit Profile',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="profile/[id]" 
          options={{ 
            title: 'Profile',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="match/[matchId]" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="schedule/[threadId]" 
          options={{ 
            title: 'Schedule Call',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="call/lobby/[callEventId]" 
          options={{ 
            title: 'Call Lobby',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="call/in/[callEventId]" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="feedback/[callEventId]" 
          options={{ 
            title: 'How was your call?',
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
          }} 
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
