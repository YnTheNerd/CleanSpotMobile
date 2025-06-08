import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Palette de couleurs moderne
const COLORS = {
  background: '#F9FAFB',
  primary: '#1E3A8A',
  accent: '#10B981',
  text: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  overlay: 'rgba(30, 58, 138, 0.1)'
};

export default function Index() {
  console.log("🏠 Index chargé avec succès - Version complète");
  const router = useRouter();

  const handleLogin = () => {
    console.log("🔐 Navigation vers login");
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    console.log("📝 Navigation vers register");
    router.push('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        {/* Header avec animation */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Text style={styles.title}>CleanSpot</Text>
          <Text style={styles.subtitle}>
            Toi aussi, agis pour un monde plus propre ! 🌍
          </Text>
        </Animated.View>

        {/* Description engageante */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.description}
        >
          <Text style={styles.descriptionText}>
            Tu vois un dépôt d'ordures qui gâche le paysage ? Prends ton phone, fais une photo, et signale-le en deux clics. Ensemble, on peut nettoyer nos rues et protéger notre planète. Allez, commence maintenant !
          </Text>
        </Animated.View>

        {/* Features avec icônes */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(600)}
          style={styles.features}
        >
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureText}>Prends une photo</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>Localise le problème</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📤</Text>
            <Text style={styles.featureText}>Envoie le signalement</Text>
          </View>
        </Animated.View>

        {/* Boutons d'action */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(800)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleRegister}>
            <Text style={styles.buttonText}>S'inscrire</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  description: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 60,
    paddingHorizontal: 16,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonSecondary: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});