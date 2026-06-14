import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Complaint } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '@constants/index';

interface Props {
  complaint: Complaint;
}

const { width } = Dimensions.get('window');
// Calculate badge width based on screen size
const BADGE_WIDTH = width - 60;
const BADGE_HEIGHT = BADGE_WIDTH;

export default function CivicBadge({ complaint }: Props) {
  const badgeUrl = `${API_CONFIG.baseUrl}/complaints/${complaint.id}/badge`;

  const handleShare = async () => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Civic Impact Badge Unlocked! 🏆</Text>
      <Text style={styles.subtitle}>Thank you for making our city better. Share your achievement!</Text>
      
      {/* Badge Image */}
      <View style={styles.badgeWrapper}>
        <Image 
          source={{ uri: badgeUrl }} 
          style={styles.badgeImage}
          resizeMode="contain"
        />
      </View>

      {/* Share Buttons */}
      <View style={styles.shareActions}>
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#FFF" />
          <Text style={styles.shareBtnText}>Share Achievement</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E1',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F3E32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  badgeWrapper: {
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  shareActions: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    gap: 12,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
