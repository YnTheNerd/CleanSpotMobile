import React from 'react';
import { Stack } from 'expo-router';

const AuthLayout = () => {
  console.log("🔐 Auth Layout chargé");
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a5f3f',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false, // We'll handle headers in individual screens
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Connexion',
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Créer un compte',
        }} 
      />
    </Stack>
  );
};

export default AuthLayout;
