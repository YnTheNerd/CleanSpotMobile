import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

export const pickImageFromGallery = async () => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre galerie pour sélectionner une image.'
      );
      return null;
    }

    // Configure picker options for better compatibility
    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      // Add these options for Android compatibility
      ...(Platform.OS === 'android' && {
        legacy: true, // Use legacy picker on Android
        selectionLimit: 1,
      }),
    };

    console.log('🖼️ Ouverture de la galerie avec options:', pickerOptions);

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

    console.log('📱 Résultat du picker:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      console.log('✅ Image sélectionnée:', selectedImage.uri);
      return selectedImage.uri;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la sélection d\'image:', error);
    
    // Provide user-friendly error message
    Alert.alert(
      'Erreur',
      'Impossible de sélectionner l\'image. Veuillez réessayer ou utiliser l\'appareil photo.'
    );
    
    return null;
  }
};

export const takePhotoWithCamera = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre appareil photo.'
      );
      return null;
    }

    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };

    console.log('📸 Ouverture de l\'appareil photo');

    const result = await ImagePicker.launchCameraAsync(pickerOptions);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photo = result.assets[0];
      console.log('✅ Photo prise:', photo.uri);
      return photo.uri;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la prise de photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    return null;
  }
};