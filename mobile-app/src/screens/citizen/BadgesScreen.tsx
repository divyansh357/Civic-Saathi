import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Pressable, ScrollView, Image, ActivityIndicator, Dimensions, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useComplaintStore, useAuthStore } from '@store/index';
import { Complaint } from '@/types';
import { API_CONFIG } from '@constants/index';
import { apiGet } from '@/services/api/client';

interface Props {
  onBack: () => void;
}

const { width } = Dimensions.get('window');
const BADGE_WIDTH = width - 60;
const BADGE_HEIGHT = BADGE_WIDTH;

export default function BadgesScreen({ onBack }: Props) {
  const complaints = useComplaintStore((s) => s.complaints);
  const setComplaints = useComplaintStore((s) => s.setComplaints);
  const isLoading = useComplaintStore((s) => s.isLoading);
  const setLoading = useComplaintStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const res = await apiGet<{ content: Complaint[] }>(
          '/complaints/user/my-complaints?page=0&size=50&sortBy=createdAt&sortDir=DESC',
          accessToken
        );
        setComplaints(res.content ?? []);
      } catch (e) {
        console.error('Failed to fetch complaints', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComplaints();
  }, [accessToken, setComplaints, setLoading]);

  // Filter only closed complaints that belong to the citizen
  const closedComplaints = complaints.filter(
    (c: Complaint) => c.status === 'CLOSED'
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const shareBadge = async (badgeUrl: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Your device does not support sharing at this time.');
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}badge-achievement.png`;
      
      const { uri } = await FileSystem.downloadAsync(badgeUrl, fileUri, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true'
        }
      });

      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share my Civic Impact Badge!',
        mimeType: 'image/png',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to share the badge image.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Civic Badges</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Ionicons name="medal" size={48} color="#F59E0B" />
          <Text style={styles.heroTitle}>Your Civic Impact</Text>
          <Text style={styles.heroSubtitle}>
            Every time you help resolve an issue in your city, you earn a badge. Here is your collection of achievements.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#6A8D73" style={{ marginTop: 40 }} />
        ) : closedComplaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No badges yet</Text>
            <Text style={styles.emptyStateDesc}>
              Report issues and track them to closure to earn your first Civic Impact Badge!
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {closedComplaints.map((complaint: Complaint) => {
              const isExpanded = expandedId === complaint.id;
              const badgeUrl = `${API_CONFIG.baseUrl}/complaints/${complaint.id}/badge`;
              
              return (
                <View key={complaint.id} style={styles.card}>
                  <Pressable 
                    style={styles.cardHeader} 
                    onPress={() => toggleExpand(complaint.id)}
                  >
                    <View style={styles.cardInfo}>
                      <Text style={styles.complaintTitle} numberOfLines={1}>
                        {complaint.title}
                      </Text>
                      <Text style={styles.complaintId}>
                        ID: {complaint.id.substring(0, 8)}
                      </Text>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.badgeContainer}>
                      <View style={styles.badgeWrapper}>
                        <Image 
                          source={{ uri: badgeUrl }} 
                          style={styles.badgeImage}
                          resizeMode="contain"
                        />
                      </View>
                      
                      <Pressable 
                        style={styles.shareBtn} 
                        onPress={() => shareBadge(badgeUrl)}
                      >
                        <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.shareBtnText}>Share Achievement</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#0F172A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 16,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  complaintId: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  badgeContainer: {
    padding: 16,
    paddingTop: 0,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  badgeWrapper: {
    width: BADGE_WIDTH - 32,
    height: BADGE_WIDTH - 32,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    width: '100%',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
