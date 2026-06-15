import React, { useEffect, useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import WorkerProfileScreen from './WorkerProfileScreen';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Alert, Platform, Modal, TextInput, Switch, Linking
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useAuthStore } from '@store/index';
import { apiGet, apiPost, apiPut } from '@services/api/client';
import { WatermarkProcessor, WatermarkProcessorRef } from '@components/WatermarkProcessor';
import { Assignment, Complaint } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import ComplaintDetailScreen from '../citizen/ComplaintDetailScreen';

type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Extend Assignment type for mobile
interface WorkerAssignment extends Assignment {
  complaintDescription?: string;
  complaintAddress?: string;
  complaintLatitude?: number;
  complaintLongitude?: number;
  distance?: number; // Distance from worker's current location
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function openMaps(latitude: number, longitude: number, address?: string) {
  const label = address ? encodeURIComponent(address) : 'Task Location';
  const url = Platform.select({
    ios: `maps:0,0?q=${latitude},${longitude}(${label})`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
  });
  
  if (url) {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps. Please check if a map application is installed.');
    });
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#60a5fa',
  ACKNOWLEDGED: '#a78bfa',
  IN_PROGRESS: '#fb923c',
  COMPLETED: '#34d399',
  ESCALATED: '#f87171',
};

function isSlaBreached(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function getSlaLabel(deadline?: string) {
  if (!deadline) return null;
  const breached = isSlaBreached(deadline);
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = Math.abs(d.getTime() - now.getTime());
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  return { breached, label: breached ? `${diffH}h ${diffM}m overdue` : `${diffH}h ${diffM}m left` };
}

interface AssignmentCardProps {
  assignment: WorkerAssignment;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
  onNavigate: (assignment: WorkerAssignment) => void;
  onViewDetails: (assignment: WorkerAssignment) => void;
}

function AssignmentCard({ assignment, onAccept, onReject, onComplete, onNavigate, onViewDetails }: AssignmentCardProps) {
  const color = STATUS_COLORS[assignment.status] ?? '#64748b';
  const sla = getSlaLabel(assignment.slaDeadline);

  return (
    <Pressable style={[styles.card, assignment.status === 'ESCALATED' && styles.cardEscalated]} onPress={() => onViewDetails(assignment)}>
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusPillText, { color }]}>{assignment.status.replace(/_/g, ' ')}</Text>
        </View>
        {sla && (
          <Text style={[styles.slaText, { color: sla.breached ? '#f87171' : sla.label.includes('1h') ? '#fbbf24' : '#94A3B8' }]}>
            {sla.breached ? <Ionicons name="close-circle-outline" size={20} color="red" /> : <Ionicons name="alert-circle-outline" size={20} color="orange" />} {sla.label}
          </Text>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {assignment.complaintTitle ?? assignment.complaintNumber ?? assignment.complaintId}
      </Text>

      {assignment.complaintAddress && (
        <View style={styles.addressRow}>
          <Text style={styles.cardAddress} numberOfLines={1}><Ionicons name="location-outline" size={20} color="#64748b" /> {assignment.complaintAddress}</Text>
          {assignment.distance !== undefined && (
            <Text style={styles.distanceText}>{assignment.distance.toFixed(1)} km</Text>
          )}
        </View>
      )}

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>Dept: {assignment.departmentName ?? '—'}</Text>
        {assignment.priority && (
          <View style={styles.priorityTag}>
            <Text style={styles.priorityTagText}>{assignment.priority}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {/* Navigation button for all active assignments */}
        {assignment.complaintLatitude && assignment.complaintLongitude && 
         !['COMPLETED'].includes(assignment.status) && (
          <Pressable style={styles.navBtn} onPress={() => onNavigate(assignment)}>
            <Text style={styles.navBtnText}><Ionicons name="map-outline" size={20} color="#64748b" /> Navigate</Text>
          </Pressable>
        )}
        
        {assignment.status === 'PENDING' && (
          <>
            <Pressable style={styles.actionBtn} onPress={() => onAccept(assignment.id)}>
              <Text style={styles.actionBtnText}><Ionicons name="checkmark" size={16} color="#fff" /> Accept</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnRed]} onPress={() => onReject(assignment.id)}>
              <Text style={[styles.actionBtnText, { color: "#b91c1c" }]}><Ionicons name="close" size={16} color="#b91c1c" /> Reject</Text>
            </Pressable>
          </>
        )}
        {assignment.status === 'IN_PROGRESS' && (
          <Pressable style={[styles.actionBtn, styles.actionBtnGreen]} onPress={() => onComplete(assignment.id)}>
            <Text style={[styles.actionBtnText, { color: "#065f46" }]}><Ionicons name="checkmark-circle" size={16} color="#065f46" /> Mark Complete</Text>
          </Pressable>
        )}
        {assignment.status === 'ACKNOWLEDGED' && (
          <Pressable style={[styles.actionBtn, styles.actionBtnYellow]} onPress={() => onAccept(assignment.id)}>
            <Text style={[styles.actionBtnText, { color: "#92400e" }]}><Ionicons name="build" size={16} color="#92400e" /> Start Work</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}



export default function WorkerHomeScreen({ onNavigateToNotifications }: { onNavigateToNotifications?: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [workerId, setWorkerId] = useState<string | null>(null);
  const watermarkProcessorRef = useRef<WatermarkProcessorRef>(null);
  
  // Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<WorkerAssignment | null>(null);
  const [complaintDetails, setComplaintDetails] = useState<Complaint | null>(null);
  const [fetchingComplaint, setFetchingComplaint] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showAadharModal, setShowAadharModal] = useState(false);
  const [aadharInput, setAadharInput] = useState('');
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [savingAadhar, setSavingAadhar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Denial modal state
  const [denialAssignment, setDenialAssignment] = useState<WorkerAssignment | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [submittingDenial, setSubmittingDenial] = useState(false);



  // Get worker's current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setWorkerLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  // Calculate distances for assignments
  const calculateAssignmentDistances = (assignments: WorkerAssignment[]) => {
    if (!workerLocation) return assignments;
    
    return assignments.map(assignment => {
      if (assignment.complaintLatitude && assignment.complaintLongitude) {
        const distance = calculateDistance(
          workerLocation.latitude,
          workerLocation.longitude,
          assignment.complaintLatitude,
          assignment.complaintLongitude
        );
        return { ...assignment, distance };
      }
      return assignment;
    });
  };

  const { data: workerData, isLoading: workerLoading } = useQuery({
    queryKey: ['worker-profile', user?.id],
    queryFn: () => apiGet<any>(`/workers/user/${user?.id}`, accessToken!),
    enabled: !!accessToken && !!user?.id,
  });

  const resolvedWorkerId = workerData?.id || workerId;

  useEffect(() => {
    if (workerData) {
      setWorkerId(workerData.id);
      setIsAvailable(workerData.status === 'ACTIVE');
    }
  }, [workerData]);

  const endpoint = activeTab === 'active' 
    ? `/assignments/worker/${resolvedWorkerId}?page=0&size=20`
    : `/assignments/worker/${resolvedWorkerId}/completed?page=0&size=20`;

  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['worker-assignments', resolvedWorkerId, activeTab],
    queryFn: () => apiGet<{ data: WorkerAssignment[] }>(endpoint, accessToken!),
    enabled: !!accessToken && !!resolvedWorkerId,
  });

  useEffect(() => {
    if (assignmentsData?.data) {
      if (activeTab === 'active') {
        setAssignments(calculateAssignmentDistances(assignmentsData.data));
      } else {
        setAssignments(assignmentsData.data);
      }
    } else {
      setAssignments([]);
    }
  }, [assignmentsData, activeTab]);

  const { data: unreadQueryCount, refetch: refetchUnread } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => apiGet<number>('/notifications/unread/count', accessToken!),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (unreadQueryCount !== undefined) {
      setUnreadCount(unreadQueryCount);
    }
  }, [unreadQueryCount]);

  useEffect(() => { 
    void getCurrentLocation();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = loading || workerLoading || assignmentsLoading;

  // Recalculate distances when worker location changes
  useEffect(() => {
    if (workerLocation && assignments.length > 0 && activeTab === 'active') {
      const assignmentsWithDistance = calculateAssignmentDistances(assignments);
      setAssignments(assignmentsWithDistance);
    }
  }, [workerLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync location to backend
  useEffect(() => {
    if (workerLocation && workerId && accessToken) {
      apiPut(`/workers/${workerId}/location`, {
        latitude: workerLocation.latitude,
        longitude: workerLocation.longitude
      }, accessToken).catch(e => console.log('Failed to sync location to server:', e));
    }
  }, [workerLocation, workerId, accessToken]);

  const onRefresh = async () => { 
    setRefreshing(true); 
    try {
      void getCurrentLocation();
      await Promise.all([refetchAssignments(), refetchUnread()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!workerId || !accessToken) return;
    try {
      const prev = isAvailable;
      setIsAvailable(!prev); // optimistic UI
      await apiPost(`/workers/${workerId}/availability`, {}, accessToken);
    } catch (err) {
      console.error('Failed to toggle availability', err);
      setIsAvailable(isAvailable); // revert on failure
      Alert.alert('Error', 'Failed to update availability status.');
    }
  };

  const handleNavigate = (assignment: WorkerAssignment) => {
    if (assignment.complaintLatitude && assignment.complaintLongitude) {
      openMaps(assignment.complaintLatitude, assignment.complaintLongitude, assignment.complaintAddress);
    }
  };

  const handleAccept = async (id: string) => {
    if (!accessToken) return;
    try {
      const assignment = assignments.find(a => a.id === id);
      if (assignment?.status === 'PENDING') {
        await apiPost(`/assignments/${id}/acknowledge`, {}, accessToken);
        setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
      } else if (assignment?.status === 'ACKNOWLEDGED') {
        await apiPost(`/assignments/${id}/start`, {}, accessToken);
        setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'IN_PROGRESS' as const } : a));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to process request';
      if (msg.toLowerCase().includes('aadhar')) {
        setPendingAssignmentId(id);
        setShowAadharModal(true);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  const handleSaveAadhar = async () => {
    if (aadharInput.length !== 12) {
      Alert.alert('Error', 'Aadhar number must be exactly 12 digits.');
      return;
    }
    setSavingAadhar(true);
    try {
      await apiPut('/workers/me/profile', { aadharNumber: aadharInput }, accessToken || undefined);
      setShowAadharModal(false);
      Alert.alert('Success', 'Aadhar saved successfully. You can now accept tasks.');
      if (pendingAssignmentId) {
        await handleAccept(pendingAssignmentId);
        setPendingAssignmentId(null);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save Aadhar');
    } finally {
      setSavingAadhar(false);
    }
  };

  const handleReject = (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) return;
    setDenialAssignment(assignment);
    setDenialReason('');
  };

  const handleSubmitDenial = async () => {
    if (!denialAssignment || !accessToken) return;
    if (!denialReason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason before submitting.');
      return;
    }
    setSubmittingDenial(true);
    try {
      const isAutoAssigned = (denialAssignment as any).isAutoAssigned === true;
      if (isAutoAssigned) {
        // Auto-assigned → direct rejection, sends message to admin
        await apiPost(`/assignments/${denialAssignment.id}/reject`, { reason: denialReason.trim() }, accessToken);
        Alert.alert('Task Rejected', 'Your rejection message has been sent to the admin.');
        void refetchAssignments();
      } else {
        // Manually assigned → send denial request to admin
        await apiPost(`/assignments/${denialAssignment.id}/denial-request`, { reason: denialReason.trim() }, accessToken);
        Alert.alert(
          'Denial Request Sent',
          'Your denial request has been sent to the admin. The task remains assigned until the admin reviews it.'
        );
      }
      setDenialAssignment(null);
      setDenialReason('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit denial');
    } finally {
      setSubmittingDenial(false);
    }
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset || cloudName.includes('your_cloud_name') || cloudName === 'demo_cloud') {
      console.warn("Cloudinary configuration is missing. Using local media URI for development.");
      return uri;
    }
    const formData = new FormData();
    const isVideo = uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov');
    const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
    const ext = isVideo ? 'mp4' : 'jpg';
    
    formData.append('file', { uri, type: mimeType, name: `proof_${Date.now()}.${ext}` } as any);
    formData.append('upload_preset', uploadPreset);
    
    // using /auto/upload instead of /image/upload to support both image and video
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Media upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const handleComplete = async (id: string) => {
    if (!accessToken) return;
    Alert.alert('Complete Task', 'You must provide 2 to 4 photos as proof of resolution. Please capture them using your camera.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Capture Proofs', onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Camera access is needed for proof.');
              return;
            }
            
            const capturedAssets: ImagePicker.ImagePickerAsset[] = [];
            // Loop up to 4 times to let them capture multiple images
            for (let i = 0; i < 4; i++) {
              const result = await ImagePicker.launchCameraAsync({ 
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                exif: true,
              });
              
              if (!result.canceled && result.assets && result.assets[0]) {
                capturedAssets.push(result.assets[0]);
                if (i < 3) {
                  // Ask if they want to capture another
                  const captureMore = await new Promise((resolve) => {
                    Alert.alert('Photo Captured', `You have captured ${capturedAssets.length} photo(s). Do you want to capture another? (Max 4)`, [
                      { text: 'No, submit now', onPress: () => resolve(false) },
                      { text: 'Yes, capture another', onPress: () => resolve(true) }
                    ]);
                  });
                  if (!captureMore) break;
                }
              } else {
                break; // They canceled
              }
            }
            
            if (capturedAssets.length > 0) {
              if (capturedAssets.length < 2) {
                Alert.alert('Insufficient Proofs', 'Please capture at least 2 photos.');
                return;
              }
              setLoading(true);
              
              // Watermark logic
              const processedUris: string[] = [];
              let locationCoords = null;
              try {
                const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
                if (locStatus === 'granted') {
                  const loc = await Location.getCurrentPositionAsync({});
                  locationCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                }
              } catch (e) {
                console.error("Worker location error:", e);
              }
              
              const userName = useAuthStore.getState().user?.name || 'Worker';
              const dateStr = require('date-fns').format(new Date(), 'dd-MMM-yyyy');
              const timeStr = require('date-fns').format(new Date(), 'HH:mm:ss');
              
              for (const asset of capturedAssets) {
                let finalUri = asset.uri;
                if (watermarkProcessorRef.current) {
                  try {
                    finalUri = await watermarkProcessorRef.current.processImage(asset.uri, {
                      latitude: locationCoords?.lat || asset.exif?.GPSLatitude || null,
                      longitude: locationCoords?.lng || asset.exif?.GPSLongitude || null,
                      date: dateStr,
                      time: timeStr,
                      userName: userName
                    });
                  } catch (e) {
                    console.error("Watermark error:", e);
                  }
                }
                processedUris.push(finalUri);
              }

              const uploadPromises = processedUris.map(uri => uploadImageToCloudinary(uri));
              const uploadedUrls = await Promise.all(uploadPromises);
              
              await apiPost(`/assignments/${id}/complete`, { images: uploadedUrls }, accessToken);
              setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'COMPLETED' as const } : a));
              Alert.alert('Success', 'Task completed successfully and sent for admin verification!');
            }
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to complete');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleViewDetails = async (assignment: WorkerAssignment) => {
    if (!accessToken) return;
    setSelectedAssignment(assignment);
    setFetchingComplaint(true);
    try {
      const data = await apiGet<Complaint>(`/complaints/${assignment.complaintId}`, accessToken);
      setComplaintDetails(data);
    } catch (err) {
      console.error('Failed to fetch complaint details', err);
      Alert.alert('Error', 'Could not load complaint details');
      setSelectedAssignment(null);
    } finally {
      setFetchingComplaint(false);
    }
  };

  const active = assignments.filter((a) => !['COMPLETED'].includes(a.status));
  const completed = assignments.filter((a) => a.status === 'COMPLETED');

  // Sort active assignments by distance (closest first) if location is available
  const sortedActive = workerLocation 
    ? active.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : active;

  if (showProfile) {
    return <WorkerProfileScreen onBack={() => setShowProfile(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
    >
      <Modal visible={showAadharModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Aadhar Required</Text>
            <Text style={{ color: '#64748b', marginBottom: 20 }}>Please provide your 12-digit Aadhar number to accept tasks. This is a one-time requirement.</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 }}
              placeholder="1234 5678 9012"
              keyboardType="number-pad"
              maxLength={12}
              value={aadharInput}
              onChangeText={setAadharInput}
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Pressable style={{ padding: 12 }} onPress={() => { setShowAadharModal(false); setPendingAssignmentId(null); }}>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ backgroundColor: '#0F766E', padding: 12, borderRadius: 8, opacity: savingAadhar ? 0.7 : 1 }} onPress={() => void handleSaveAadhar()} disabled={savingAadhar}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{savingAadhar ? 'Saving...' : 'Submit & Accept'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.workerHeader}>
        <View>
          <Text style={styles.workerName}>{user?.name ?? 'Worker'}</Text>
          <Text style={styles.workerRole}>Field Worker</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
              thumbColor={isAvailable ? '#0F766E' : '#94a3b8'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: -4 }}
            />
            <Text style={[styles.locationStatus, { marginLeft: 4, marginTop: 0, color: isAvailable ? '#0F766E' : '#64748b' }]}>
              {isAvailable ? 'Available for work' : 'Not available'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {onNavigateToNotifications && (
            <Pressable style={styles.notificationBtn} onPress={onNavigateToNotifications}>
              <View>
                <Text style={styles.notificationIcon}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </View>
            </Pressable>
          )}
          <Pressable style={styles.notificationBtn} onPress={() => setShowProfile(true)}>
            <Text style={styles.notificationIcon}><Ionicons name="person-outline" size={20} color="#64748b" /></Text>
          </Pressable>
          <Pressable style={styles.logoutBtn} onPress={() => void logout()}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Active', value: active.length, color: '#fbbf24' },
          { label: 'Completed', value: completed.length, color: '#34d399' },
          { label: 'Total', value: assignments.length, color: '#60a5fa' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>Active</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>Work History</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{activeTab === 'active' ? 'Active Assignments' : 'Completed Works'} ({activeTab === 'active' ? active.length : completed.length})</Text>
        {workerLocation && active.length > 0 && activeTab === 'active' && (
          <Text style={styles.sortNote}>Sorted by distance</Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#0F766E" style={{ marginTop: 24 }} />
      ) : (activeTab === 'active' ? active.length : completed.length) === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>{activeTab === 'active' ? 'All caught up!' : 'No history yet'}</Text>
          <Text style={styles.emptySubtitle}>{activeTab === 'active' ? 'No active assignments right now' : 'Complete assignments to build your history'}</Text>
        </View>
      ) : (
        (activeTab === 'active' ? sortedActive : completed).map((a) => (
          <AssignmentCard 
            key={a.id} 
            assignment={a} 
            onAccept={handleAccept}
            onReject={handleReject} 
            onComplete={handleComplete} 
            onNavigate={handleNavigate}
            onViewDetails={handleViewDetails}
          />
        ))
      )}

      {/* Complaint Details Modal */}
      <Modal visible={!!selectedAssignment} animationType="slide" onRequestClose={() => setSelectedAssignment(null)}>
        {fetchingComplaint || !complaintDetails ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={{ marginTop: 16, color: '#64748b' }}>Loading details...</Text>
            <Pressable style={{ marginTop: 30, padding: 10 }} onPress={() => setSelectedAssignment(null)}>
              <Text style={{ color: '#0F766E', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <ComplaintDetailScreen 
            complaint={complaintDetails} 
            onBack={() => {
              setSelectedAssignment(null);
              setComplaintDetails(null);
            }} 
          />
        )}
      </Modal>

      {/* ── Denial Modal ───────────────────────────────────────────────────────── */}
      <Modal
        visible={!!denialAssignment}
        transparent
        animationType="fade"
        onRequestClose={() => setDenialAssignment(null)}
      >
        <View style={denialStyles.overlay}>
          <View style={denialStyles.sheet}>
            {/* Header */}
            <View style={denialStyles.header}>
              <Text style={denialStyles.title}>
                {(denialAssignment as any)?.isAutoAssigned
                  ? '❌ Reject Task'
                  : '📩 Request Denial'}
              </Text>
              <Pressable onPress={() => setDenialAssignment(null)}>
                <Text style={denialStyles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {/* Context note */}
            <Text style={denialStyles.contextNote}>
              {(denialAssignment as any)?.isAutoAssigned
                ? 'This task was auto-assigned by the system. Your rejection reason will be sent as a message to the admin.'
                : 'This task was manually assigned by an admin. Your denial request will be sent to the admin for review. The task remains assigned until the admin reassigns it.'}
            </Text>

            {/* Complaint ref */}
            <Text style={denialStyles.complaintRef} numberOfLines={2}>
              Task: {denialAssignment?.complaintTitle ?? denialAssignment?.complaintId}
            </Text>

            {/* Reason input */}
            <Text style={denialStyles.label}>Reason <Text style={{ color: '#DC2626' }}>*</Text></Text>
            <TextInput
              style={denialStyles.input}
              value={denialReason}
              onChangeText={setDenialReason}
              placeholder="e.g. Location too far, Outside my expertise, Emergency at home..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={denialStyles.charCount}>{denialReason.length}/500</Text>

            {/* Actions */}
            <View style={denialStyles.actions}>
              <Pressable
                style={denialStyles.cancelBtn}
                onPress={() => setDenialAssignment(null)}
              >
                <Text style={denialStyles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  denialStyles.submitBtn,
                  (submittingDenial || !denialReason.trim()) && denialStyles.submitBtnDisabled,
                ]}
                onPress={() => void handleSubmitDenial()}
                disabled={submittingDenial || !denialReason.trim()}
              >
                {submittingDenial
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={denialStyles.submitBtnText}>
                      {(denialAssignment as any)?.isAutoAssigned ? 'Submit Rejection' : 'Send Request'}
                    </Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
    <WatermarkProcessor ref={watermarkProcessorRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 16, paddingBottom: 32 },
  workerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  workerName: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  workerRole: { fontSize: 13, color: '#64748B', marginTop: 2 },
  locationStatus: { fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationBtn: {
    backgroundColor: '#F0FDF9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  notificationIcon: { fontSize: 18 },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#0F766E' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  sortNote: { fontSize: 11, color: '#64748B', fontStyle: 'italic' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardEscalated: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  slaText: { fontSize: 11, fontWeight: '500' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardAddress: { fontSize: 12, color: '#64748B', flex: 1 },
  distanceText: { fontSize: 11, color: '#0F766E', fontWeight: '600', marginLeft: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  priorityTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityTagText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  cardActions: { flexDirection: 'row', gap: 8 },
  navBtn: {
    backgroundColor: '#F0F9FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#BAE6FD',
  },
  navBtnText: { fontSize: 12, fontWeight: '600', color: '#0369A1' },
  actionBtn: {
    flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  actionBtnGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  actionBtnYellow: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actionBtnRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});

const denialStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  closeBtn: { fontSize: 18, color: '#64748B', paddingHorizontal: 4 },
  contextNote: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  complaintRef: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5D4E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F1',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E1E5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2F3E32',
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#4A5D4E' },
  submitBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
