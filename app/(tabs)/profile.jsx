import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
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

const ProfileScreen = () => {
  console.log("👤 Profile - Écran de profil chargé");
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔥 Profile useEffect - Setting up auth listener");
    let unsubscribe;

    try {
      unsubscribe = authService.onAuthStateChange((user) => {
        console.log("👤 Auth state changed in Profile:", user ? "User logged in" : "No user");
        if (user) {
          setUser(user);
          loadUserStats();
        } else {
          console.log("🔄 No user, redirecting to landing page");
          router.replace('/');
        }
      });
    } catch (error) {
      console.error("❌ Error setting up auth listener in Profile:", error);
      setLoading(false);
    }

    return () => {
      console.log("🧹 Profile cleanup - Unsubscribing auth listener");
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array to prevent infinite loop

  const loadUserStats = async () => {
    try {
      console.log("📊 Profile - Loading user stats");
      const stats = await firestoreService.getUserStats();

      console.log("📊 Profile - Stats received:", stats);
      setStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default stats on error
      setStats({
        totalReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = () => {
    Alert.alert(
      'Réinitialiser le mot de passe',
      'Un email de réinitialisation sera envoyé à votre adresse email.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              await authService.resetPassword(user.email);
              Alert.alert(
                'Email envoyé',
                'Un email de réinitialisation a été envoyé à votre adresse email.'
              );
            } catch (error) {
              console.error('Password reset error:', error);
              Alert.alert('Erreur', 'Impossible d\'envoyer l\'email de réinitialisation');
            }
          },
        },
      ]
    );
  };

  const formatJoinDate = (user) => {
    if (!user?.metadata?.creationTime) return '';
    const date = new Date(user.metadata.creationTime);
    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de votre profil..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0)?.toUpperCase() || 
             user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.displayName || 'Utilisateur'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.metadata?.creationTime && (
          <Text style={styles.joinDate}>
            Membre depuis {formatJoinDate(user)}
          </Text>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Vos statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReports}</Text>
            <Text style={styles.statLabel}>Total signalements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {stats.pendingReports}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#007AFF' }]}>
              {stats.inProgressReports}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              {stats.resolvedReports}
            </Text>
            <Text style={styles.statLabel}>Résolus</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/reports')}>
          <Text style={styles.actionIcon}>📋</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Mes signalements</Text>
            <Text style={styles.actionSubtitle}>Voir tous vos signalements</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/report/create')}>
          <Text style={styles.actionIcon}>📸</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Nouveau signalement</Text>
            <Text style={styles.actionSubtitle}>Signaler un nouveau dépôt sauvage</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleResetPassword}>
          <Text style={styles.actionIcon}>🔑</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Changer le mot de passe</Text>
            <Text style={styles.actionSubtitle}>Réinitialiser votre mot de passe</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>À propos de CleanSpot</Text>
        <Text style={styles.aboutText}>
          CleanSpot, c'est l'appli qui te donne le pouvoir de changer les choses ! On en a tous marre des déchets qui traînent partout, pas vrai ? Avec CleanSpot, tu peux signaler un dépôt d'ordures en un clin d'œil et aider à rendre tes rues plus propres.
          {'\n\n'}
          On connecte les citoyens comme toi avec ceux qui agissent sur le terrain. Prêt à rejoindre le mouvement ? Fais le premier pas et rends le monde meilleur, un signalement à la fois ! 🌱
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      <View style={styles.logoutSection}>
        <CustomButton
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  header: {
    backgroundColor: MODERN_COLORS.primary,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MODERN_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: MODERN_COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: MODERN_COLORS.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  joinDate: {
    fontSize: 14,
    color: MODERN_COLORS.white,
    opacity: 0.8,
  },
  statsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MODERN_COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f3f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  aboutSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  aboutText: {
    fontSize: 16,
    color: MODERN_COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 14,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
});

export default ProfileScreen;
