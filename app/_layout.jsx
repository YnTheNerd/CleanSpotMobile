import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

// Palette de couleurs moderne
const MODERN_COLORS = {
  background: '#F9FAFB',
  backgroundDark: '#111827',
  primary: '#1E3A8A',
  primaryDark: '#1F2937',
  accent: '#10B981',
  text: '#111827',
  textDark: '#FFFFFF',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB'
};

const RootLayout = () => {
  console.log("🏗️ Root Layout monté");
  const colorScheme = useColorScheme();
  const headerColor = colorScheme === 'dark' ? MODERN_COLORS.primaryDark : MODERN_COLORS.primary;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'auto'} />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: headerColor,
          },
          headerTintColor: MODERN_COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 300 } },
            close: { animation: 'timing', config: { duration: 300 } },
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen
          name="report"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="map"
          options={{
            title: 'Sélection de position',
            headerShown: false,
            presentation: 'modal',
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 300 } },
              close: { animation: 'timing', config: { duration: 300 } },
            },
          }}
        />
      </Stack>
      
    </>
  );
};

export default RootLayout;
