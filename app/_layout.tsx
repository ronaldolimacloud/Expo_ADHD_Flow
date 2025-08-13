import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeDatabase } from '@/lib/db';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useFrameworkReady();

  useEffect(() => {
    async function setupDatabase() {
      try {
        await initializeDatabase();
        setIsDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    }
    
    setupDatabase();
  }, []);

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing BrainPocket...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack>
        {/* Main tab navigator as a route group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Detail pushed screens */}
        <Stack.Screen name="ideas/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="projects/[id]" options={{ headerShown: false }} />

        {/* Modal screens */}
        
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});