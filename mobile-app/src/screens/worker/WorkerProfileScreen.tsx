import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@store/index';
import { apiGet, apiPutWithHeaders } from '@services/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerProfileScreen({ onBack }: { onBack?: () => void }) {
  const user = useAuthStore(s => s.user);
  const accessToken = useAuthStore(s => s.accessToken);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previousWorks, setPreviousWorks] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [aadharNo, setAadharNo] = useState<string>('');
  const [workerCode, setWorkerCode] = useState<string>('');
  const [workerId, setWorkerId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!accessToken || !user) return;
    try {
      const res = await apiGet<any>(`/workers/user/${user.id}`, accessToken);
      if (res.id) setWorkerId(res.id);
      if (res.profileImageUrl) setProfileImage(res.profileImageUrl);
      if (res.address) setAddress(res.address);
      if (res.aadharNo) setAadharNo(res.aadharNo);
      if (res.workerCode) setWorkerCode(res.workerCode);
      if (res.previousWorks) {
        // Parse JSON if needed
        try {
          const worksArray = JSON.parse(res.previousWorks);
          setPreviousWorks(Array.isArray(worksArray) ? worksArray.join(', ') : res.previousWorks);
        } catch {
          setPreviousWorks(res.previousWorks);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset || cloudName.includes('your_cloud_name')) {
      throw new Error("Cloudinary configuration is missing. Please check your .env file.");
    }
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: `profile_${Date.now()}.jpg` } as any);
    formData.append('upload_preset', uploadPreset);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!accessToken || !workerId) return;
    setSaving(true);
    try {
      let finalImageUrl = profileImage;
      // If profileImage is a local file uri (not http)
      if (profileImage && profileImage.startsWith('file://')) {
        finalImageUrl = await uploadImageToCloudinary(profileImage);
      }

      const worksArray = previousWorks.split(',').map(w => w.trim()).filter(w => w.length > 0);
      
      await apiPutWithHeaders(`/workers/${workerId}/profile`, {
        profileImageUrl: finalImageUrl,
        previousWorks: JSON.stringify(worksArray),
        address,
        aadharNo,
        workerCode
      }, accessToken, { 'User-Id': user?.id });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{marginTop: 50}} color="#0F766E" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        )}
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imageSection}>
          <Pressable onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImg} />
            ) : (
              <View style={styles.placeholderImg}>
                <Ionicons name="person" size={40} color="#94A3B8" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.nameText}>{user?.name}</Text>
          <Text style={styles.roleText}>Field Worker</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput 
            style={[styles.input, { minHeight: 40 }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your full address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Aadhar Number</Text>
          <TextInput 
            style={[styles.input, { minHeight: 40 }]}
            value={aadharNo}
            onChangeText={setAadharNo}
            placeholder="Enter 12-digit Aadhar"
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Worker Code (Optional)</Text>
          <TextInput 
            style={[styles.input, { minHeight: 40 }]}
            value={workerCode}
            onChangeText={setWorkerCode}
            placeholder="e.g. WK-001"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Previous Works (comma separated)</Text>
          <TextInput 
            style={styles.input}
            value={previousWorks}
            onChangeText={setPreviousWorks}
            placeholder="e.g. Fixed pothole on MG Road, Pipe repair"
            multiline
          />
        </View>

        <Pressable 
          style={[styles.saveBtn, saving && {opacity: 0.7}]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#0F172A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  content: { padding: 20 },
  imageSection: { alignItems: 'center', marginBottom: 30 },
  profileImg: { width: 100, height: 100, borderRadius: 50 },
  placeholderImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0F766E', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  nameText: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  roleText: { fontSize: 14, color: '#64748B' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#0F766E', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
