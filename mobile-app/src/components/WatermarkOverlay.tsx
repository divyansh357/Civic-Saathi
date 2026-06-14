import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

interface WatermarkOverlayProps {
  imageUri: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  userName: string;
}

export const WatermarkOverlay = forwardRef<View, WatermarkOverlayProps>(
  ({ imageUri, latitude, longitude, date, time, userName }, ref) => {
    // We render this in absolute positioning far off-screen so the user doesn't see it jumping around,
    // but view-shot can still capture it.
    return (
      <View style={styles.container} pointerEvents="none">
        <View ref={ref} style={styles.captureContainer} collapsable={false}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>
              {latitude && longitude ? `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` : 'Location: Unavailable'}
            </Text>
            <Text style={styles.watermarkText}>{date}</Text>
            <Text style={styles.watermarkText}>{time}</Text>
            <Text style={styles.watermarkText}>{userName}</Text>
          </View>
        </View>
      </View>
    );
  }
);

const { width } = Dimensions.get('window');
const TARGET_WIDTH = width; // Keep it proportional to device width
const TARGET_HEIGHT = width * 1.33; // Standard 4:3 aspect ratio

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    opacity: 0,
  },
  captureContainer: {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  watermarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 2,
  },
});
