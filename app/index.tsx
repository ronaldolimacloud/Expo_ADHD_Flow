import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Landing() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BrainPocket</Text>
        <Text style={styles.subtitle}>Capture ideas, projects, and tasks</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)/projects')}>
          <Text style={styles.ctaText}>Enter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  actions: { padding: 20 },
  cta: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});