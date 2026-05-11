import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useAuthStore } from '@store/index';
import { apiPost } from '@services/api/client';

const CATEGORIES = [
  { id: 'ROADS', label: '🛣️ Roads', desc: 'Potholes, damage, cave-ins' },
  { id: 'WATER', label: '💧 Water', desc: 'Supply, leaks, quality' },
  { id: 'SANITATION', label: '🗑️ Sanitation', desc: 'Garbage, sewage, drains' },
  { id: 'ELECTRICITY', label: '⚡ Electricity', desc: 'Street lights, outages' },
  { id: 'PARKS', label: '🌳 Parks', desc: 'Maintenance, equipment' },
  { id: 'OTHER', label: '📌 Other', desc: 'Miscellaneous issues' },
];

const PRIORITIES = [
  { id: 'CRITICAL', label: '🔴 Critical', color: '#f87171' },
  { id: 'HIGH', label: '🟠 High', color: '#fb923c' },
  { id: 'MEDIUM', label: '🟡 Medium', color: '#fbbf24' },
  { id: 'LOW', label: '🔵 Low', color: '#60a5fa' },
];

interface NewComplaintScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function NewComplaintScreen({ onBack, onSuccess }: NewComplaintScreenProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Level A Features: Image, Voice, Location
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const canSubmit = title.trim().length >= 5 && category !== '' && description.trim().length >= 10;

  // Auto-fetch location on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Location Permission', 'Location access is needed to auto-fill your complaint location.');
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Reverse geocoding to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressComponents = reverseGeocode[0];
      const formattedAddress = addressComponents 
        ? `${addressComponents.street || ''} ${addressComponents.name || ''}, ${addressComponents.city || ''}`
        : 'Location detected';

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress,
      });
      
      if (!address) {
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please enter address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll access is needed to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not access photos. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Could not access camera. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setVoiceNote(uri);
      setRecording(null);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Could not save voice note. Please try again.');
    }
  };

  const removeVoiceNote = () => {
    setVoiceNote(null);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || !accessToken) return;
    setSubmitting(true);
    try {
      const complaintData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        address: address.trim(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        // TODO: Upload images and voice note to storage service
        // For now, we'll just submit the text data
      };

      await apiPost('/complaints', complaintData, accessToken);
      
      Alert.alert('Success', 'Your complaint has been submitted successfully!', [
        { text: 'OK', onPress: onSuccess }
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Issue Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the issue"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.hint}>{title.length}/100 characters</Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryCard, category === cat.id && styles.categoryCardActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.label.split(' ')[0]}</Text>
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                  {cat.label.split(' ').slice(1).join(' ')}
                </Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.priorityBtn, priority === p.id && { backgroundColor: `${p.color}20`, borderColor: p.color }]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[styles.priorityText, priority === p.id && { color: p.color }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue in detail. Include any relevant information that would help resolve it faster."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.hint}>{description.length}/1000 characters</Text>
        </View>

        {/* Location Section */}
        <View style={styles.field}>
          <Text style={styles.label}>Location / Address</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Street address or landmark"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
            <Pressable 
              style={styles.locationBtn} 
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <Text style={styles.locationBtnText}>📍</Text>
              )}
            </Pressable>
          </View>
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Images Section */}
        <View style={styles.field}>
          <Text style={styles.label}>Photos (Optional)</Text>
          <View style={styles.mediaContainer}>
            <Pressable style={styles.addMediaBtn} onPress={showImageOptions}>
              <Text style={styles.addMediaIcon}>📷</Text>
              <Text style={styles.addMediaText}>Add Photo</Text>
            </Pressable>
            
            {images.length > 0 && (
              <ScrollView horizontal style={styles.imageScroll} showsHorizontalScrollIndicator={false}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <Pressable 
                      style={styles.removeImageBtn} 
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Voice Note Section */}
        <View style={styles.field}>
          <Text style={styles.label}>Voice Note (Optional)</Text>
          <View style={styles.mediaContainer}>
            {!voiceNote ? (
              <Pressable 
                style={[styles.addMediaBtn, isRecording && styles.recordingBtn]} 
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.addMediaIcon}>
                  {isRecording ? '⏹️' : '🎤'}
                </Text>
                <Text style={styles.addMediaText}>
                  {isRecording ? 'Stop Recording' : 'Record Voice Note'}
                </Text>
                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Recording...</Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={styles.voiceNoteContainer}>
                <View style={styles.voiceNoteInfo}>
                  <Text style={styles.voiceNoteIcon}>🎵</Text>
                  <Text style={styles.voiceNoteText}>Voice note recorded</Text>
                </View>
                <Pressable style={styles.removeVoiceBtn} onPress={removeVoiceNote}>
                  <Text style={styles.removeVoiceText}>✕</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit Complaint</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Your complaint will be reviewed and assigned to the relevant department within 24 hours.
        </Text>
      </ScrollView>
    </View>
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
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  required: { color: '#f87171' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'right' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0F172A',
  },
  textarea: { height: 120, paddingTop: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  categoryCardActive: { borderColor: '#0F766E', backgroundColor: '#F0FDF9' },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  categoryLabelActive: { color: '#0F766E' },
  categoryDesc: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  submitBtn: {
    backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  disclaimer: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  
  // Location styles
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationBtn: {
    backgroundColor: '#F0FDF9', borderWidth: 1.5, borderColor: '#0F766E',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', minWidth: 44,
  },
  locationBtnText: { fontSize: 16 },
  locationInfo: {
    backgroundColor: '#F0FDF9', borderRadius: 8, padding: 8, marginTop: 8,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  locationText: { fontSize: 12, color: '#0F766E', fontWeight: '500' },
  
  // Media styles
  mediaContainer: { gap: 12 },
  addMediaBtn: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
  },
  recordingBtn: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  addMediaIcon: { fontSize: 20 },
  addMediaText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  
  // Image styles
  imageScroll: { marginTop: 8 },
  imageContainer: { position: 'relative', marginRight: 8 },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  removeImageText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  
  // Voice note styles
  voiceNoteContainer: {
    backgroundColor: '#F0FDF9', borderWidth: 1.5, borderColor: '#0F766E',
    borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceNoteInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceNoteIcon: { fontSize: 18 },
  voiceNoteText: { fontSize: 14, fontWeight: '600', color: '#0F766E' },
  removeVoiceBtn: {
    backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  removeVoiceText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  
  // Recording indicator
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  recordingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
  },
  recordingText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
});
