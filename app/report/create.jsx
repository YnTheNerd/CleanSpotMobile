import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { takePhoto, pickImage } from '../../utils/imageUtils';
import { getCurrentLocation, getAddressFromCoordinates } from '../../utils/locationUtils';
import { authService, firestoreService, storageService } from '../../services/firebaseService';

const CreateReportScreen = () => {
  console.log("➕ Create - Création de signalement chargée");
  const router = useRouter();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    description: '',
    imageUri: null,
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log("➕ Create Report - Écran de création chargé");
    // Check if user is authenticated
    const user = authService.getCurrentUser();
    console.log("👤 Current user in Create Report:", user ? user.email : "No user");

    if (!user) {
      console.log("⚠️ No user found, redirecting to login");
      // Redirect to login if no user is authenticated
      router.replace('/(auth)/login');
    }
  }, [router]);

  // Handle coordinates returned from map selection
  useEffect(() => {
    if (params.selectedLatitude && params.selectedLongitude) {
      const latitude = parseFloat(params.selectedLatitude);
      const longitude = parseFloat(params.selectedLongitude);

      console.log("🗺️ Coordonnées reçues de la carte:", { latitude, longitude });

      // Validate coordinates before processing
      if (isNaN(latitude) || isNaN(longitude)) {
        console.error('🚨 Coordonnées invalides reçues:', { latitude, longitude });
        return;
      }

      // CORRECTION CRITIQUE: Vérifier qu'il n'y a pas déjà une localisation en cours de traitement
      console.log("🔄 Traitement des coordonnées de la carte - état actuel:", {
        hasCurrentLocation: !!formData.location,
        currentSource: formData.location?.source || 'none'
      });

      // Get address for the selected coordinates
      getAddressFromCoordinates(latitude, longitude)
        .then(address => {
          const mapLocation = {
            latitude,
            longitude,
            address: address?.formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            source: 'map',
            timestamp: Date.now() // Timestamp pour débogage
          };

          console.log("✅ Définition de la localisation carte:", mapLocation);

          setFormData(prev => ({
            ...prev,
            location: mapLocation
          }));

          // Clear location error if it exists
          setErrors(prev => ({ ...prev, location: null }));
        })
        .catch(error => {
          console.error('🚨 Erreur lors de la récupération de l\'adresse:', error);

          const mapLocation = {
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            source: 'map',
            timestamp: Date.now()
          };

          console.log("⚠️ Définition de la localisation carte (sans adresse):", mapLocation);

          setFormData(prev => ({
            ...prev,
            location: mapLocation
          }));

          // Clear location error if it exists
          setErrors(prev => ({ ...prev, location: null }));
        });
    }
  }, [params.selectedLatitude, params.selectedLongitude]); // Dépendances stables uniquement

  // Restore form data when returning from map
  // CORRECTION CRITIQUE: Ajouter navigationTimestamp pour éviter les restaurations multiples
  useEffect(() => {
    if ((params.formDescription || params.formImageUri) && params.navigationTimestamp) {
      console.log("🔄 Restauration des données du formulaire depuis la carte");
      console.log("🕐 Navigation timestamp:", params.navigationTimestamp);

      setFormData(prev => ({
        ...prev,
        ...(params.formDescription && { description: params.formDescription }),
        ...(params.formImageUri && { imageUri: params.formImageUri }),
      }));

      console.log("✅ Données du formulaire restaurées:", {
        description: params.formDescription || 'non définie',
        imageUri: params.formImageUri ? 'présente' : 'non définie',
        timestamp: params.navigationTimestamp,
      });
    }
  }, [params.formDescription, params.formImageUri, params.navigationTimestamp]);

  // CORRECTION CRITIQUE: Fonction utilitaire pour nettoyer l'état de localisation
  const clearLocationState = (reason = 'unknown') => {
    console.log(`🧹 Nettoyage de l'état de localisation - Raison: ${reason}`);
    setFormData(prev => {
      if (prev.location) {
        console.log("🗑️ Suppression de la localisation précédente:", {
          source: prev.location.source,
          coordinates: `${prev.location.latitude}, ${prev.location.longitude}`
        });
      }
      return { ...prev, location: null };
    });

    // Clear location error if it exists
    setErrors(prev => ({ ...prev, location: null }));
  };

  const updateFormData = (field, value) => {
    console.log(`📝 Mise à jour du champ ${field}:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log("📊 Nouvel état du formulaire:", {
        description: newData.description ? `${newData.description.length} caractères` : 'vide',
        imageUri: newData.imageUri ? 'présente' : 'non définie',
        location: newData.location ? `${newData.location.source} - ${newData.location.latitude}, ${newData.location.longitude}` : 'non définie',
      });
      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }

    if (!formData.imageUri) {
      newErrors.image = 'Une photo est requise';
    }

    if (!formData.location) {
      newErrors.location = 'La localisation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTakePhoto = async () => {
    try {
      const imageUri = await takePhoto();
      if (imageUri) {
        updateFormData('imageUri', imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', error.message || 'Impossible de prendre une photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        updateFormData('imageUri', imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', error.message || 'Impossible de sélectionner une image');
    }
  };

  const handleGetCurrentLocation = async () => {
    console.log("📍 Début de géolocalisation GPS");

    // CORRECTION CRITIQUE: Nettoyer automatiquement toute localisation précédente
    clearLocationState('switch-to-gps');

    setLocationLoading(true);
    try {
      console.log("🔍 Acquisition de la position GPS...");
      const location = await getCurrentLocation();
      const address = await getAddressFromCoordinates(location.latitude, location.longitude);

      console.log("✅ Position GPS acquise:", { latitude: location.latitude, longitude: location.longitude });

      // Définir la nouvelle localisation GPS avec source explicite
      const gpsLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address?.formattedAddress || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        accuracy: location.accuracy,
        source: 'gps', // Source explicite pour éviter les conflits
        timestamp: Date.now() // Timestamp pour débogage
      };

      updateFormData('location', gpsLocation);
      console.log("📍 Localisation GPS définie avec succès:", gpsLocation);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Erreur de localisation',
        error.message || 'Impossible d\'obtenir votre position. Vous pouvez sélectionner manuellement sur la carte.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log("ℹ️ Utilisateur informé de l'erreur de géolocalisation");
            }
          }
        ]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSelectOnMap = () => {
    console.log("🗺️ Début de sélection carte");

    // CORRECTION CRITIQUE: Nettoyer automatiquement toute localisation précédente
    const previousLocation = formData.location;
    clearLocationState('switch-to-map');

    // Préparer les paramètres avec les données du formulaire pour préservation
    const mapParams = {
      // Coordonnées actuelles si disponibles (pour centrer la carte)
      ...(previousLocation && {
        latitude: previousLocation.latitude.toString(),
        longitude: previousLocation.longitude.toString(),
      }),
      // Préserver les données du formulaire
      formDescription: formData.description || '',
      formImageUri: formData.imageUri || '',
      // Indicateur que nous venons du formulaire de création
      returnTo: 'create-report',
      // Timestamp pour éviter les conflits de cache
      timestamp: Date.now().toString(),
    };

    console.log("🗺️ Paramètres envoyés à la carte:", mapParams);

    router.push({
      pathname: '/map',
      params: mapParams,
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Upload image to Firebase Storage
      const imagePath = `reports/${user.uid}/${Date.now()}.jpg`;
      const imageUrl = await storageService.uploadImage(formData.imageUri, imagePath);

      // Create report data
      const reportData = {
        description: formData.description.trim(),
        imageUrl: imageUrl,
        location: formData.location,
        status: 'pending',
      };

      // Save to Firestore
      const reportId = await firestoreService.createSignal(reportData);

      Alert.alert(
        'Signalement créé',
        'Votre signalement a été envoyé avec succès. Merci de contribuer à un environnement plus propre !',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/reports'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert(
        'Erreur',
        'Impossible de créer le signalement. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Prendre une photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choisir dans la galerie',
          onPress: handlePickImage,
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Création du signalement..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouveau signalement</Text>
          <Text style={styles.subtitle}>
            Aidez-nous à identifier les dépôts sauvages
          </Text>
        </View>

        <View style={styles.form}>
          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo du dépôt sauvage *</Text>
            <TouchableOpacity
              style={[styles.imageContainer, errors.image && styles.imageContainerError]}
              onPress={showImagePicker}
            >
              {formData.imageUri ? (
                <Image source={{ uri: formData.imageUri }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📸</Text>
                  <Text style={styles.imagePlaceholderText}>
                    Appuyez pour ajouter une photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <CustomInput
              label="Description du problème *"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Décrivez le dépôt sauvage (type d'ordures, quantité, etc.)"
              multiline
              numberOfLines={4}
              error={errors.description}
            />
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation *</Text>

            {/* Location Selection Buttons - Always Visible */}
            <View style={styles.locationButtonsContainer}>
              <CustomButton
                title={locationLoading ? "Localisation..." : "📍 Ma position actuelle"}
                onPress={handleGetCurrentLocation}
                loading={locationLoading}
                variant="outline"
                style={[styles.locationButton, styles.locationButtonHalf]}
              />
              <CustomButton
                title="🗺️ Choisir sur la carte"
                onPress={handleSelectOnMap}
                variant="outline"
                style={[styles.locationButton, styles.locationButtonHalf]}
              />
            </View>

            {/* Location Display - Show when location is selected */}
            {formData.location && (
              <View style={styles.locationDisplay}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress}>
                    {formData.location.address}
                  </Text>
                  <Text style={styles.locationCoords}>
                    {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => clearLocationState('manual-clear')}
                >
                  <Text style={styles.changeLocationText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Submit Button */}
          <CustomButton
            title="Envoyer le signalement"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("🔙 Annulation du formulaire - retour à l'écran précédent");
            // CORRECTION CRITIQUE: Utiliser replace pour éviter l'accumulation dans la pile
            router.replace('/(tabs)/reports');
          }}
        >
          <Text style={styles.backButtonText}>← Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f3f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainerError: {
    borderColor: '#FF3B30',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
  },
  changeLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeLocationText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    borderColor: '#1a5f3f',
  },
  locationButtonHalf: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#1a5f3f',
    marginTop: 16,
  },
  backButton: {
    alignSelf: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
});

export default CreateReportScreen;
