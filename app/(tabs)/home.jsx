import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
// Use real Firebase service
import { authService, firestoreService } from '../../services/firebaseService';

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

const HomeScreen = () => {
  console.log("🏠 Home - Écran d'accueil chargé");
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("🔥 Home useEffect - Using real Firebase service");
    let unsubscribe;

    try {
      unsubscribe = authService.onAuthStateChange((user) => {
        console.log("👤 Auth state changed in Home:", user ? "User logged in" : "No user");
        if (user) {
          setUser(user);
          loadRecentReports();
        } else {
          console.log("🔄 No user, redirecting to login");
          // Redirect to login if no user is authenticated
          router.replace('/(auth)/login');
        }
      });
    } catch (error) {
      console.error("❌ Error setting up auth listener in Home:", error);
      setLoading(false);
    }

    return () => {
      console.log("🧹 Home cleanup - Unsubscribing auth listener");
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array to prevent infinite loop

  const loadRecentReports = async () => {
    console.log("📊 Loading recent reports (using real Firebase service)");
    try {
      const result = await firestoreService.getUserSignals(3);
      const reports = result.signals || result;
      setRecentReports(reports.slice(0, 3));
    } catch (error) {
      console.error('Error loading recent reports:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger vos signalements. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentReports();
    setRefreshing(false);
  };

  const handleNewReport = () => {
    router.push('/report/create');
  };

  const handleViewAllReports = () => {
    router.push('/(tabs)/reports');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'in_progress':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement de vos données...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Salut {user?.displayName || user?.email?.split('@')[0] || 'toi'} ! 👋
        </Text>
        <Text style={styles.welcomeSubtext}>
          Prêt à faire la différence ? Signale un dépôt sauvage maintenant !
        </Text>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.newReportButton} onPress={handleNewReport}>
          <Text style={styles.buttonText}>📸 Nouveau signalement</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Vos statistiques</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recentReports.length}</Text>
            <Text style={styles.statLabel}>Signalements récents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {recentReports.filter(r => r.status === 'resolved').length}
            </Text>
            <Text style={styles.statLabel}>Résolus</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {recentReports.filter(r => r.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>
      </View>

      {recentReports.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Signalements récents</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllReports}>
              <Text style={styles.viewAllButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {recentReports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportDate}>
                  {formatDate(report.createdAt)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(report.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(report.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportDescription} numberOfLines={2}>
                {report.description || 'Aucune description'}
              </Text>
              {report.location && (
                <Text style={styles.reportLocation} numberOfLines={1}>
                  📍 {report.location.address || 'Localisation disponible'}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {recentReports.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🌱</Text>
          <Text style={styles.emptyStateTitle}>Aucun signalement</Text>
          <Text style={styles.emptyStateText}>
            Commencez par créer votre premier signalement pour aider à garder votre environnement propre !
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  welcomeSection: {
    backgroundColor: MODERN_COLORS.primary,
    padding: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_COLORS.white,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: MODERN_COLORS.white,
    opacity: 0.9,
  },
  actionSection: {
    padding: 24,
  },
  newReportButton: {
    backgroundColor: MODERN_COLORS.accent,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: MODERN_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MODERN_COLORS.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MODERN_COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  viewAllButtonText: {
    fontSize: 14,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  reportLocation: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HomeScreen;
