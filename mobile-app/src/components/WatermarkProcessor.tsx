import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';

export interface WatermarkMetadata {
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  userName: string;
}

export interface WatermarkProcessorRef {
  processImage: (uri: string, metadata: WatermarkMetadata) => Promise<string>;
}

export const WatermarkProcessor = forwardRef<WatermarkProcessorRef, {}>((_, ref) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [currentTask, setCurrentTask] = useState<{ uri: string; metadata: WatermarkMetadata } | null>(null);

  useImperativeHandle(ref, () => ({
    processImage: (uri: string, metadata: WatermarkMetadata): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Set the state so it renders
        setCurrentTask({ uri, metadata });

        // Wait a bit for the image to load and the view to render
        setTimeout(async () => {
          try {
            if (viewShotRef.current && viewShotRef.current.capture) {
              const resultUri = await viewShotRef.current.capture();
              setCurrentTask(null);
              resolve(resultUri);
            } else {
              reject(new Error("ViewShot capture method not available"));
            }
          } catch (error) {
            setCurrentTask(null);
            reject(error);
          }
        }, 500); // 500ms delay to ensure image is loaded before capture
      });
    }
  }));

  if (!currentTask) return null;

  const { uri, metadata } = currentTask;

  return (
    <View style={styles.container} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.captureContainer}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>
            {metadata.latitude && metadata.longitude
              ? `Lat: ${metadata.latitude.toFixed(6)}, Lng: ${metadata.longitude.toFixed(6)}`
              : 'Location: Unavailable'}
          </Text>
          <Text style={styles.watermarkText}>Date: {metadata.date}</Text>
          <Text style={styles.watermarkText}>Time: {metadata.time}</Text>
          <Text style={styles.watermarkText}>User: {metadata.userName}</Text>
        </View>
      </ViewShot>
    </View>
  );
});

const { width } = Dimensions.get('window');
const TARGET_WIDTH = width;
const TARGET_HEIGHT = width * 1.33; // 4:3

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
