import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const SimpleIndex = () => {
  console.log("🏠 Index Simple chargé");
  const router = useRouter();

  const handleGoToTabs = () => {
    console.log("🔄 Navigation vers les tabs");
    router.push('/(tabs)/home');
  };

  const handleGoToAuth = () => {
    console.log("🔄 Navigation vers auth");
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CleanSpot - Test Simple</Text>
      <Text style={styles.subtitle}>Version de test sans Firebase</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGoToTabs}>
          <Text style={styles.buttonText}>Aller aux Tabs (Test)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleGoToAuth}>
          <Text style={styles.buttonText}>Aller à l'Auth</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.info}>
        Si vous voyez cette page, l'application de base fonctionne !
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a5f3f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SimpleIndex;
