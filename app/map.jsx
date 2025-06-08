import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import NetInfo from '@react-native-community/netinfo';
import debounce from 'lodash.debounce';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomButton from '../components/CustomButton';
import MapErrorBoundary from '../components/MapErrorBoundary';

// Palette de couleurs CleanSpot
const COLORS = {
  background: '#F9FAFB',
  primary: '#1E3A8A',
  accent: '#10B981',
  text: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  error: '#EF4444',
};

// Région par défaut (Yaoundé, Cameroun)
const DEFAULT_REGION = {
  latitude: 3.8480,
  longitude: 11.5021,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

function MapScreenContent() {
  console.log("🗺️ Map Screen chargé");
  
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // États existants
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

  // États de recherche OSM
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Références pour la recherche et la carte
  const searchTimeoutRef = useRef(null);
  const lastSearchTimeRef = useRef(0);
  const mapRef = useRef(null);

  // Fonction de recherche Nominatim avec rate limiting
  const searchLocation = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Rate limiting: 1 seconde minimum entre les requêtes
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTimeRef.current;
    if (timeSinceLastSearch < 1000) {
      console.log("🚫 Rate limiting: attente avant prochaine recherche");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    lastSearchTimeRef.current = now;

    try {
      console.log("🔍 Recherche OSM pour:", query);

      // Configuration de la requête Nominatim
      const searchUrl = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `countrycodes=cm&` + // Limiter au Cameroun
        `addressdetails=1&` +
        `extratags=1`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'CleanSpotApp/1.0 (contact: cleanspot@example.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📍 Résultats de recherche OSM:", data.length, "résultats");

      // Traitement des résultats
      const processedResults = data.map((item, index) => ({
        id: `search-${index}`,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        title: item.display_name.split(',')[0], // Premier élément du nom
        subtitle: item.display_name,
        type: item.type || 'location',
        importance: item.importance || 0,
      })).filter(result =>
        // Validation des coordonnées
        typeof result.latitude === 'number' &&
        typeof result.longitude === 'number' &&
        isFinite(result.latitude) &&
        isFinite(result.longitude) &&
        result.latitude >= -90 && result.latitude <= 90 &&
        result.longitude >= -180 && result.longitude <= 180
      );

      setSearchResults(processedResults);
      setShowSearchResults(processedResults.length > 0);

      if (processedResults.length === 0) {
        setSearchError("Aucun résultat trouvé pour cette recherche");
      }

    } catch (error) {
      console.error("🚨 Erreur de recherche OSM:", error);
      setSearchError("Erreur lors de la recherche. Vérifiez votre connexion.");
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Fonction de recherche avec debounce
  const debouncedSearch = useCallback(
    debounce((query) => {
      searchLocation(query);
    }, 500), // 500ms de délai pour éviter le spam
    [searchLocation]
  );

  // Gestion du changement de texte de recherche
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);

    // Nettoyer le timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length >= 3) {
      debouncedSearch(text.trim());
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchError(null);
    }
  }, [debouncedSearch]);

  // Gestion de la sélection d'un résultat de recherche
  const handleSearchResultSelect = useCallback((result) => {
    console.log("📍 Sélection du résultat de recherche:", result);

    // Définir la nouvelle position
    const location = {
      latitude: result.latitude,
      longitude: result.longitude,
    };

    setSelectedLocation(location);

    // Centrer la carte sur la position sélectionnée
    setMapRegion({
      ...location,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Masquer les résultats de recherche
    setShowSearchResults(false);
    setSearchQuery(result.title);

    console.log("✅ Position définie depuis la recherche:", location);
  }, []);

  // Fonction pour nettoyer la recherche lors d'un tap manuel sur la carte
  const clearSearchResults = useCallback(() => {
    setShowSearchResults(false);
    setSearchError(null);
    console.log("🧹 Résultats de recherche nettoyés (tap manuel)");
  }, []);

  // Vérification de la connexion internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log("🌐 Network state:", state.isConnected);
      setIsConnected(state.isConnected);
    });

    // Vérification initiale
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer les timeouts de recherche
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Annuler les requêtes debounced en cours
      debouncedSearch.cancel();
      console.log("🧹 Nettoyage des ressources de recherche");
    };
  }, [debouncedSearch]);

  // Initialisation avec les coordonnées existantes si disponibles
  // CORRECTION CRITIQUE: Dépendances spécifiques pour éviter les boucles infinies
  useEffect(() => {
    if (params.latitude && params.longitude) {
      const lat = parseFloat(params.latitude);
      const lng = parseFloat(params.longitude);

      console.log("🔄 Initialisation de la carte avec coordonnées:", { lat, lng });

      if (isValidCoordinate(lat, lng)) {
        const location = { latitude: lat, longitude: lng };
        setSelectedLocation(location);
        setMapRegion({
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        console.log("📍 Location initiale définie:", location);
      } else {
        console.warn("⚠️ Coordonnées initiales invalides:", { lat, lng });
      }
    }
  }, [params.latitude, params.longitude]); // CORRECTION: Dépendances spécifiques uniquement

  // Validation robuste des coordonnées
  const isValidCoordinate = useCallback((lat, lng) => {
    try {
      // Vérification des types
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('🚨 Invalid coordinate types:', { lat: typeof lat, lng: typeof lng });
        return false;
      }

      // Vérification des valeurs NaN ou Infinity
      if (!isFinite(lat) || !isFinite(lng)) {
        console.warn('🚨 Non-finite coordinates:', { lat, lng });
        return false;
      }

      // Vérification des plages valides
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('🚨 Coordinates out of range:', { lat, lng });
        return false;
      }

      return true;
    } catch (error) {
      console.error('🚨 Error validating coordinates:', error);
      return false;
    }
  }, []);

  // Référence pour le compteur de taps
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  // Fonction de traitement des coordonnées (non-debounced)
  // CORRECTION CRITIQUE: Supprimer la dépendance isValidCoordinate pour éviter les re-renders
  const processCoordinates = useCallback((coordinate) => {
    try {
      const { latitude, longitude } = coordinate;

      console.log('🗺️ Processing coordinates:', {
        latitude,
        longitude,
        timestamp: Date.now(),
        tapCount: tapCountRef.current,
      });

      // Validation inline pour éviter les dépendances
      if (typeof latitude === 'number' && typeof longitude === 'number' &&
          isFinite(latitude) && isFinite(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180) {

        const location = { latitude, longitude };
        setSelectedLocation(location);

        // NOUVEAU: Nettoyer les résultats de recherche lors d'un tap manuel
        clearSearchResults();

        console.log("✅ Location sélectionnée manuellement:", location);
      } else {
        console.warn('⚠️ Coordonnées invalides ignorées:', { latitude, longitude });
      }
    } catch (error) {
      console.error('🚨 Erreur lors du traitement des coordonnées:', error);
    }
  }, [clearSearchResults]); // Ajout de la dépendance clearSearchResults

  // Fonction debounced pour les taps sur la carte
  const debouncedMapPress = useCallback(
    debounce((coordinate) => {
      processCoordinates(coordinate);
    }, 250), // 250ms de délai entre les taps traités
    [processCoordinates]
  );

  // Gestion des taps sur la carte avec logging détaillé
  const handleMapPress = useCallback((event) => {
    try {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      tapCountRef.current += 1;
      lastTapTimeRef.current = now;

      console.log('🗺️ Map tap detected:', {
        tapNumber: tapCountRef.current,
        timeSinceLastTap,
        coordinate: event.nativeEvent.coordinate,
        pressure: event.nativeEvent.pressure,
        timestamp: now,
      });

      // Vérification de base de l'événement
      if (!event?.nativeEvent?.coordinate) {
        console.warn('⚠️ Invalid tap event:', event);
        return;
      }

      // Appel de la fonction debounced
      debouncedMapPress(event.nativeEvent.coordinate);

    } catch (error) {
      console.error('🚨 Erreur dans handleMapPress:', error);
    }
  }, [debouncedMapPress]);

  // Confirmation de la sélection
  // CORRECTION CRITIQUE: Utiliser useCallback pour éviter les re-renders
  const handleConfirmLocation = useCallback(() => {
    if (!selectedLocation) {
      Alert.alert('Aucune position', 'Veuillez sélectionner une position sur la carte');
      return;
    }

    console.log("✅ Location confirmée:", selectedLocation);
    console.log("🔄 Données du formulaire à préserver:", {
      formDescription: params.formDescription || 'non définie',
      formImageUri: params.formImageUri ? 'présente' : 'non définie',
    });

    // Retour vers l'écran de création avec les coordonnées sélectionnées ET les données du formulaire
    const returnParams = {
      selectedLatitude: selectedLocation.latitude.toString(),
      selectedLongitude: selectedLocation.longitude.toString(),
      // Préserver les données du formulaire
      ...(params.formDescription && { formDescription: params.formDescription }),
      ...(params.formImageUri && { formImageUri: params.formImageUri }),
      // Ajouter un timestamp pour éviter les conflits de cache
      navigationTimestamp: Date.now().toString(),
    };

    console.log("📤 Paramètres de retour vers create:", returnParams);

    // CORRECTION CRITIQUE: Utiliser replace au lieu de push pour éviter l'accumulation dans la pile de navigation
    router.replace({
      pathname: '/report/create',
      params: returnParams,
    });
  }, [selectedLocation, params.formDescription, params.formImageUri, router]);

  // Fonction de recentrage de la carte sur la position sélectionnée
  const handleRecenterMap = useCallback(() => {
    if (!selectedLocation || !mapRef.current) {
      console.warn("⚠️ Impossible de recentrer: pas de position sélectionnée ou référence carte manquante");
      return;
    }

    console.log("🎯 Recentrage de la carte sur:", selectedLocation);

    const region = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    // Animation fluide vers la position sélectionnée
    mapRef.current.animateToRegion(region, 1000);
  }, [selectedLocation]);

  // Gestion de l'absence de connexion
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🌐</Text>
          <Text style={styles.errorTitle}>Pas de connexion internet</Text>
          <Text style={styles.errorText}>
            Une connexion internet est nécessaire pour charger la carte.
            Veuillez vérifier votre connexion et réessayer.
          </Text>
          <CustomButton
            title="Retour"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  // Écran de chargement
  if (loading) {
    return <LoadingSpinner message="Chargement de la carte..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("🔙 Retour depuis la carte vers le formulaire");
            // CORRECTION CRITIQUE: Retour propre avec préservation des données
            const returnParams = {
              ...(params.formDescription && { formDescription: params.formDescription }),
              ...(params.formImageUri && { formImageUri: params.formImageUri }),
              navigationTimestamp: Date.now().toString(),
            };
            router.replace({
              pathname: '/report/create',
              params: returnParams,
            });
          }}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélectionner la position</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lieu (ex: Essos, Nkolmesseng...)"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color={COLORS.accent}
              style={styles.searchLoader}
            />
          )}
        </View>

        {/* Résultats de recherche */}
        {showSearchResults && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultSelect(item)}
                >
                  <Text style={styles.searchResultTitle}>{item.title}</Text>
                  <Text style={styles.searchResultSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Erreur de recherche */}
        {searchError && (
          <View style={styles.searchErrorContainer}>
            <Text style={styles.searchErrorText}>{searchError}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          📍 Appuyez sur la carte pour sélectionner la position du dépôt sauvage
        </Text>
      </View>

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
          maxZoomLevel={19} // Limite OSM
          minZoomLevel={1}
          moveOnMarkerPress={false}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={true}
          zoomEnabled={true}
          loadingEnabled={true}
          loadingIndicatorColor={COLORS.accent}
          loadingBackgroundColor={COLORS.background}
        >
          {/* Tuiles OpenStreetMap optimisées */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            minimumZ={1}
            tileSize={256}
            flipY={false}
            shouldReplaceMapContent={false}
            zIndex={-1}
          />

          {/* Marqueurs de résultats de recherche */}
          {searchResults.map((result) => (
            <Marker
              key={result.id}
              coordinate={{
                latitude: result.latitude,
                longitude: result.longitude,
              }}
              title={result.title}
              description={result.subtitle}
              pinColor={COLORS.primary}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -5 }}
              onPress={() => handleSearchResultSelect(result)}
            />
          ))}

          {/* Marqueur de position sélectionnée avec key pour éviter les re-renders */}
          {selectedLocation && (
            <Marker
              key={`selected-${selectedLocation.latitude}-${selectedLocation.longitude}`}
              coordinate={selectedLocation}
              title="Position sélectionnée"
              description="Emplacement du dépôt sauvage"
              pinColor={COLORS.accent}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -5 }}
            />
          )}
        </MapView>

        {/* Bouton de recentrage flottant */}
        {selectedLocation && (
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={handleRecenterMap}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="my-location"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Informations de position */}
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Position sélectionnée :</Text>
          <Text style={styles.locationText}>
            Latitude: {selectedLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Bouton de confirmation */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title={selectedLocation ? "Confirmer cette position" : "Sélectionnez une position"}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation}
          style={[
            styles.confirmButton,
            !selectedLocation && styles.confirmButtonDisabled
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 60, // Pour équilibrer avec le bouton retour
  },
  // Styles de recherche
  searchContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 4,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  searchErrorContainer: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  searchErrorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
  },
  // Styles du bouton de recentrage
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  instructionsContainer: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
});

// Export principal avec ErrorBoundary
export default function MapScreen() {
  const handleErrorReset = useCallback(() => {
    console.log("🔄 Map Error Boundary reset");
    // Ici, on pourrait réinitialiser des états si nécessaire
  }, []);

  return (
    <MapErrorBoundary onReset={handleErrorReset}>
      <MapScreenContent />
    </MapErrorBoundary>
  );
}
