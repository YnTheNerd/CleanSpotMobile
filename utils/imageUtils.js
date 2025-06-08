import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Request camera and media library permissions
export const requestPermissions = async () => {
  try {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      mediaLibrary: mediaLibraryPermission.status === 'granted'
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return { camera: false, mediaLibrary: false };
  }
};

// Launch camera to take a photo
export const takePhoto = async () => {
  try {
    const permissions = await requestPermissions();
    if (!permissions.camera) {
      throw new Error('Permission d\'accès à la caméra refusée');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return await compressImage(result.assets[0].uri);
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

// Pick image from gallery
export const pickImage = async () => {
  try {
    const permissions = await requestPermissions();
    if (!permissions.mediaLibrary) {
      throw new Error('Permission d\'accès à la galerie refusée');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return await compressImage(result.assets[0].uri);
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Compress image to ensure it's under 1MB when base64 encoded
export const compressImage = async (uri) => {
  try {
    let quality = 0.8;
    let compressedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Resize to max width of 800px
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Check if we need further compression
    // Rough estimate: base64 is ~1.33x larger than binary
    const maxSizeBytes = 750000; // ~750KB to account for base64 encoding
    
    while (compressedImage.width * compressedImage.height > maxSizeBytes && quality > 0.1) {
      quality -= 0.1;
      compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: Math.floor(compressedImage.width * 0.9) } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
    }

    return compressedImage.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

// Convert image to base64
export const imageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};
