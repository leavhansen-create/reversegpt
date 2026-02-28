import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function LessonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📖</Text>
      <Text style={styles.title}>Lesson</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6 },
});
