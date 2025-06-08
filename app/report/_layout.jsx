import React from 'react';
import { Stack } from 'expo-router';

export default function ReportLayout() {
  console.log("📝 Report Layout chargé");
  
  return (
    <Stack>
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'Nouveau signalement',
          presentation: 'modal',
          headerStyle: { backgroundColor: '#1a5f3f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
    </Stack>
  );
}
