import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Button } from 'react-native-paper';
import { useAuthStore } from '@store/index';
import { apiPost, apiPostWithHeaders } from '@services/api/client';
import { Ionicons } from '@expo/vector-icons';
import { WatermarkProcessor, WatermarkProcessorRef } from '@components/WatermarkProcessor';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'ROADS', icon: <Ionicons name="git-network-outline" size={24} color="#64748b" />, label: 'Roads', desc: 'Potholes, damage, cave-ins' },
  { id: 'WATER', icon: <Ionicons name="water-outline" size={24} color="#64748b" />, label: 'Water', desc: 'Supply, leaks, quality' },
  { id: 'SANITATION', icon: <Ionicons name="trash-outline" size={24} color="#64748b" />, label: 'Sanitation', desc: 'Garbage, sewage, drains' },
  { id: 'ELECTRICITY', icon: <Ionicons name="flash-outline" size={24} color="#64748b" />, label: 'Electricity', desc: 'Street lights, outages' },
  { id: 'PARKS', icon: <Ionicons name="leaf-outline" size={24} color="#64748b" />, label: 'Parks', desc: 'Maintenance, equipment' },
  { id: 'OTHER', icon: <Ionicons name="apps-outline" size={24} color="#64748b" />, label: 'Other', desc: 'Miscellaneous issues' },
];

const PRIORITIES = [
  { id: 'CRITICAL', icon: <Ionicons name="close-circle-outline" size={20} color="#f87171" />, label: 'Critical', color: '#f87171', value: 1 },
  { id: 'HIGH', icon: <Ionicons name="alert-circle-outline" size={20} color="#fb923c" />, label: 'High', color: '#fb923c', value: 2 },
  { id: 'MEDIUM', icon: <Ionicons name="alert-circle-outline" size={20} color="#fbbf24" />, label: 'Medium', color: '#fbbf24', value: 3 },
  { id: 'LOW', icon: <Ionicons name="checkmark-circle-outline" size={20} color="#60a5fa" />, label: 'Low', color: '#60a5fa', value: 4 },
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
  const userName = useAuthStore((s) => s.user?.name) || 'Unknown User';
  const watermarkProcessorRef = useRef<WatermarkProcessorRef>(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Level C: AI suggestions
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string; priority: string; confidence: number; department: string;
  } | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{
    complaintId: string; title: string; status: string; similarity: number;
  }>>([]);

  // Validation helpers
  const isTitleValid = title.trim().length >= 5;
  const isDescriptionValid = description.trim().length >= 10;
  const isCategoryValid = category !== '';
  const isLocationValid = address.trim().length > 0;
  const isPhotoValid = images.length > 0;
  const canSubmit = isTitleValid && isCategoryValid && isDescriptionValid && isLocationValid && isPhotoValid;

  // AI: suggest category when title + description are long enough
  useEffect(() => {
    if (title.trim().length < 10 || description.trim().length < 20) return;
    const timer = setTimeout(() => void runAiSuggestion(), 800);
    return () => clearTimeout(timer);
  }, [title, description]); // eslint-disable-line react-hooks/exhaustive-deps

  const runAiSuggestion = async () => {
    if (!accessToken) return;
    setAiSuggesting(true);
    try {
      const [classifyRes, dupRes] = await Promise.allSettled([
        apiPost<{ category: string; urgencyLevel: string; confidence: number; suggestedDepartment: string }>(
          '/ai/classify',
          { complaintText: title + ' ' + description },
          accessToken
        ),
        apiPost<{ hasDuplicates: boolean; candidates: Array<{ complaintId: string; title: string; status: string; similarity: number }> }>(
          '/ai/duplicate-check',
          { title, description },
          accessToken
        ),
      ]);

      if (classifyRes.status === 'fulfilled') {
        const r = classifyRes.value;
        setAiSuggestion({
          category: r.category,
          priority: r.urgencyLevel,
          confidence: r.confidence,
          department: r.suggestedDepartment,
        });
      }

      if (dupRes.status === 'fulfilled' && dupRes.value.hasDuplicates) {
        setDuplicates(dupRes.value.candidates.slice(0, 3));
      } else {
        setDuplicates([]);
      }
    } catch {
      // AI is optional — silently ignore errors
    } finally {
      setAiSuggesting(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (!category) setCategory(aiSuggestion.category);
    if (priority === 'MEDIUM') setPriority(aiSuggestion.priority);
    setAiSuggestion(null);
  };

  // Auto-fetch location on component mount
  useEffect(() => {
    requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Always check/request permission before accessing location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location access is needed to auto-fill your complaint location. Please enable it in Settings.');
        return;
      }

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
      
      // Always update address to ensure it is populated
      setAddress(formattedAddress);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please enter address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const processAndAddWatermark = async (uri: string, exifData?: any, isCamera: boolean = false) => {
    try {
      setIsWatermarking(true);
      
      let lat = null;
      let lng = null;
      let dateStr = format(new Date(), 'dd-MMM-yyyy');
      let timeStr = format(new Date(), 'HH:mm:ss');

      if (isCamera) {
        // Use current device location if it's camera
        if (location) {
          lat = location.latitude;
          lng = location.longitude;
        }
      } else {
        // Use EXIF for gallery if available, otherwise fallback to live location
        if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
          lat = exifData.GPSLatitude;
          lng = exifData.GPSLongitude;
        } else if (location) {
          lat = location.latitude;
          lng = location.longitude;
        }
      }

      if (!watermarkProcessorRef.current) return uri; // Fallback

      const watermarkedUri = await watermarkProcessorRef.current.processImage(uri, {
        latitude: lat,
        longitude: lng,
        date: dateStr,
        time: timeStr,
        userName
      });
      return watermarkedUri;
    } catch (error) {
      console.error('Watermark error:', error);
      return uri; // Fallback to original
    } finally {
      setIsWatermarking(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 photos.');
      return;
    }
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll access is needed to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, 
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        exif: true, // Request EXIF
      });

      if (!result.canceled && result.assets) {
        const processedUris: string[] = [];
        for (const asset of result.assets) {
          const processed = await processAndAddWatermark(asset.uri, asset.exif, false);
          if (processed) processedUris.push(processed);
        }
        if (processedUris.length > 0) {
          setImages(prev => [...prev, ...processedUris].slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not access photos. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 photos.');
      return;
    }
    
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
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const processed = await processAndAddWatermark(result.assets[0].uri, result.assets[0].exif, true);
        if (processed) {
          setImages(prev => [...prev, processed]);
        }
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
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 photos.');
      return;
    }
    
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

  const uploadImageToCloudinary = async (uri: string, lat?: number, lon?: number): Promise<string> => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset || cloudName.includes('your_cloud_name') || cloudName === 'demo_cloud') {
      console.warn("Cloudinary configuration is missing. Using local image URI for development.");
      return uri;
    }

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    } as any);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudinary upload failed", errText);
      throw new Error(`Image upload failed: ${res.status}`);
    }

    const data = await res.json();
    let finalUrl = data.secure_url;
    
    if (lat && lon) {
      // Add watermark with Lat, Lng, Date
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toISOString().split('T')[1].substring(0, 5);
      // Format text, replacing spaces with %20 and newlines with %0A
      const text = `Lat: ${lat.toFixed(5)}%0ALon: ${lon.toFixed(5)}%0A${dateStr} ${timeStr}`.replace(/ /g, '%20');
      // Create Cloudinary transformation string
      // l_text:Arial_25_bold:...,g_south_east,x_20,y_20,co_white
      const transform = `l_text:Arial_30_bold:${text},g_south_east,x_20,y_20,co_white`;
      
      const parts = finalUrl.split('/upload/');
      if (parts.length === 2) {
        finalUrl = `${parts[0]}/upload/${transform}/${parts[1]}`;
      }
    }
    
    return finalUrl;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);

    if (!canSubmit) {
      // Collect missing field names for the alert
      const missing: string[] = [];
      if (!isTitleValid) missing.push('Title (min 5 chars)');
      if (!isCategoryValid) missing.push('Category');
      if (!isDescriptionValid) missing.push('Description (min 10 chars)');
      if (!isLocationValid) missing.push('Location');
      if (!isPhotoValid) missing.push('Photo (at least 1)');
      Alert.alert('Missing Fields', `Please fill in:\n• ${missing.join('\n• ')}`);
      return;
    }

    if (!accessToken) return;
    const user = useAuthStore.getState().user;
    if (!user?.id) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }
    
    if (submitting) return; // Prevent concurrent submissions
    
    setSubmitting(true);
    try {
      // Map priority string to integer: 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW
      const priorityInt = PRIORITIES.find(p => p.id === priority)?.value ?? 3;

      // Upload all images to Cloudinary
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const url = await uploadImageToCloudinary(images[i], location?.latitude, location?.longitude);
        imageUrls.push(url);
      }

      const complaintData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: priorityInt,
        location: address.trim(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        imageUrls,
      };

      await apiPostWithHeaders('/complaints', complaintData, accessToken, {
        'User-Id': user.id,
      });
      
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
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                  {cat.label}
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

        {/* AI Suggestion Banner */}
        {(aiSuggesting || aiSuggestion || duplicates.length > 0) && (
          <View style={styles.aiBanner}>
            {aiSuggesting && (
              <View style={styles.aiRow}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.aiText}>Analysing complaint...</Text>
              </View>
            )}

            {!aiSuggesting && aiSuggestion && (
              <View>
                <View style={styles.aiRow}>
                  <Ionicons name="color-wand" size={16} color="#8b5cf6" style={{marginRight: 4}} />
                  <Text style={styles.aiLabel}>AI Suggestion</Text>
                  <Text style={styles.aiConfidence}>
                    {Math.round(aiSuggestion.confidence * 100)}% confident
                  </Text>
                </View>
                <Text style={styles.aiText}>
                  Category: <Text style={styles.aiHighlight}>{aiSuggestion.category}</Text>
                  {'  '}Priority: <Text style={styles.aiHighlight}>{aiSuggestion.priority}</Text>
                </Text>
                <Text style={styles.aiDept}>→ {aiSuggestion.department}</Text>
                <Pressable style={styles.aiApplyBtn} onPress={applyAiSuggestion}>
                  <Text style={styles.aiApplyText}>Apply Suggestion</Text>
                </Pressable>
              </View>
            )}

            {duplicates.length > 0 && (
              <View style={styles.dupSection}>
                <Text style={styles.dupTitle}>⚠️ Similar complaints found</Text>
                {duplicates.map((d) => (
                  <View key={d.complaintId} style={styles.dupItem}>
                    <Text style={styles.dupItemTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={styles.dupItemMeta}>
                      {d.status} · {Math.round(d.similarity * 100)}% similar
                    </Text>
                  </View>
                ))}
                <Text style={styles.dupNote}>
                  Consider checking if your issue is already reported before submitting.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Location Section */}
        <View style={styles.field}>
          <Text style={styles.label}>Location / Address <Text style={styles.required}>*</Text></Text>
          <View style={[styles.locationContainer, attemptedSubmit && !isLocationValid && styles.fieldError]}>
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
                <Text style={styles.locationBtnText}><Ionicons name="location-outline" size={20} color="#64748b" /></Text>
              )}
            </Pressable>
          </View>
          {attemptedSubmit && !isLocationValid && (
            <Text style={styles.errorText}><Ionicons name="location-outline" size={20} color="#64748b" /> Location is required. Tap the pin icon to detect or type an address.</Text>
          )}
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                <Ionicons name="location-outline" size={20} color="#64748b" /> {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Images Section */}
        <View style={styles.field}>
          <Text style={styles.label}>Photos ({images.length}/5) <Text style={styles.required}>*</Text></Text>
          <View style={[styles.mediaContainer, attemptedSubmit && !isPhotoValid && styles.fieldError]}>
            <Pressable 
              style={[styles.addMediaBtn, images.length >= 5 && { opacity: 0.5 }]} 
              onPress={showImageOptions}
              disabled={images.length >= 5}
            >
              <Text style={styles.addMediaIcon}><Ionicons name="camera-outline" size={20} color="#64748b" /></Text>
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
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          {attemptedSubmit && !isPhotoValid && (
            <Text style={styles.errorText}><Ionicons name="camera-outline" size={20} color="#64748b" /> At least one photo is required as evidence.</Text>
          )}
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
                  <Ionicons name="musical-notes" size={20} color="#1e293b" />
                  <Text style={styles.voiceNoteText}>Voice note recorded</Text>
                </View>
                <Pressable style={styles.removeVoiceBtn} onPress={removeVoiceNote}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Submit */}
        <Button
          mode="contained"
          onPress={() => void handleSubmit()}
          disabled={submitting}
          loading={submitting}
          style={styles.submitBtn}
          contentStyle={{ height: 56 }}
          labelStyle={styles.submitText}
          buttonColor="#0F766E"
        >
          Submit Complaint
        </Button>

        <Text style={styles.disclaimer}>
          Your complaint will be reviewed and assigned to the relevant department within 24 hours.
        </Text>
      </ScrollView>
      {isWatermarking && (
        <View style={styles.watermarkOverlay}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.watermarkLoadingText}>Processing image...</Text>
        </View>
      )}
      <WatermarkProcessor ref={watermarkProcessorRef} />
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
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: '500' },
  fieldError: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 10 },
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
  watermarkOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  watermarkLoadingText: { marginTop: 12, fontSize: 16, color: '#0F766E', fontWeight: '600' },

  // AI suggestion banner
  aiBanner: {
    backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  aiIcon: { fontSize: 16 },
  aiLabel: { fontSize: 13, fontWeight: '700', color: '#5B21B6', flex: 1 },
  aiConfidence: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  aiText: { fontSize: 13, color: '#4C1D95', marginBottom: 2 },
  aiHighlight: { fontWeight: '700', color: '#5B21B6' },
  aiDept: { fontSize: 12, color: '#6D28D9', marginBottom: 10 },
  aiApplyBtn: {
    backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 8,
    alignItems: 'center',
  },
  aiApplyText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Duplicate warning
  dupSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#DDD6FE' },
  dupTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  dupItem: {
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, marginBottom: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  dupItemTitle: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  dupItemMeta: { fontSize: 11, color: '#92400E', marginTop: 2 },
  dupNote: { fontSize: 11, color: '#78716C', marginTop: 4, fontStyle: 'italic' },
});
