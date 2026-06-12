import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Alert, Platform, Modal
} from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '@store/index';
import { apiGet, apiPost } from '@services/api/client';
import { Assignment, Complaint } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import ComplaintDetailScreen from '../citizen/ComplaintDetailScreen';

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
    // In a real app, you'd use Linking.openURL(url)
    Alert.alert('Navigation', `Would open maps to: ${address || `${latitude}, ${longitude}`}`);
  }
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#60a5fa',
  ACCEPTED: '#a78bfa',
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
        {assignment.complaintTitle ?? assignment.complaintId}
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
        
        {assignment.status === 'ASSIGNED' && (
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
        {assignment.status === 'ACCEPTED' && (
          <Pressable style={[styles.actionBtn, styles.actionBtnYellow]} onPress={() => onAccept(assignment.id)}>
            <Text style={[styles.actionBtnText, { color: "#92400e" }]}><Ionicons name="build" size={16} color="#92400e" /> Start Work</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

import * as ImagePicker from 'expo-image-picker';
import WorkerProfileScreen from './WorkerProfileScreen';

export default function WorkerHomeScreen({ onNavigateToNotifications }: { onNavigateToNotifications?: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [workerId, setWorkerId] = useState<string | null>(null);
  
  // Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<WorkerAssignment | null>(null);
  const [complaintDetails, setComplaintDetails] = useState<Complaint | null>(null);
  const [fetchingComplaint, setFetchingComplaint] = useState(false);

  // Enhanced mock data with location
  const MOCK: WorkerAssignment[] = [
    { 
      id: 'A-001', 
      complaintId: 'C-1001', 
      complaintTitle: 'Pothole on MG Road near bus stop', 
      departmentId: 'd1', 
      departmentName: 'Roads Department', 
      status: 'PENDING', 
      priority: 'HIGH', 
      slaDeadline: new Date(Date.now() + 3600000 * 5).toISOString(), 
      assignedAt: new Date().toISOString(), 
      complaintAddress: 'MG Road, Bengaluru',
      complaintLatitude: 12.9716,
      complaintLongitude: 77.5946
    },
    { 
      id: 'A-004', 
      complaintId: 'C-1007', 
      complaintTitle: 'Road cave-in near school', 
      departmentId: 'd1', 
      departmentName: 'Roads Department', 
      status: 'IN_PROGRESS', 
      priority: 'CRITICAL', 
      slaDeadline: new Date(Date.now() + 3600000 * 1).toISOString(), 
      assignedAt: new Date().toISOString(), 
      complaintAddress: 'Near Govt School, Koramangala',
      complaintLatitude: 12.9352,
      complaintLongitude: 77.6245
    },
  ];

  // Get worker's current location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
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
    } finally {
      setLocationLoading(false);
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

  const fetchAssignments = async (silent = false) => {
    if (!accessToken || !user) return;
    if (!silent) setLoading(true);
    try {
      let currentWorkerId = workerId;
      if (!currentWorkerId) {
        const workerRes = await apiGet<any>(`/workers/user/${user.id}`, accessToken);
        currentWorkerId = workerRes.id;
        setWorkerId(currentWorkerId);
      }
      if (!currentWorkerId) return;

      const endpoint = activeTab === 'active' 
        ? `/assignments/worker/${currentWorkerId}?page=0&size=20`
        : `/assignments/worker/${currentWorkerId}/completed?page=0&size=20`;

      const res = await apiGet<{ data: WorkerAssignment[] }>(endpoint, accessToken);
      
      if (activeTab === 'active') {
        const assignmentsWithDistance = calculateAssignmentDistances(res.data ?? []);
        setAssignments(assignmentsWithDistance);
      } else {
        setAssignments(res.data ?? []);
      }
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    void getCurrentLocation();
    void fetchAssignments(); 
  }, [accessToken, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate distances when worker location changes
  useEffect(() => {
    if (workerLocation && assignments.length > 0 && activeTab === 'active') {
      const assignmentsWithDistance = calculateAssignmentDistances(assignments);
      setAssignments(assignmentsWithDistance);
    }
  }, [workerLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => { 
    setRefreshing(true); 
    void getCurrentLocation();
    void fetchAssignments(true); 
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
      if (assignment?.status === 'ASSIGNED') {
        await apiPost(`/assignments/${id}/acknowledge`, {}, accessToken);
        setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'ACCEPTED' as const } : a));
      } else if (assignment?.status === 'ACCEPTED') {
        await apiPost(`/assignments/${id}/start`, {}, accessToken);
        setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'IN_PROGRESS' as const } : a));
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to process request');
    }
  };

  const handleReject = async (id: string) => {
    if (!accessToken) return;
    Alert.prompt(
      'Reject Task',
      'Please enter a reason for rejection (e.g. Too far, Not my scope):',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'A reason is required to reject a task.');
              return;
            }
            try {
              await apiPost(`/assignments/${id}/reject`, { reason }, accessToken);
              // Assuming backend sets it to REJECTED or removes it from worker
              fetchAssignments(); 
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reject (Admins assigned tasks cannot be rejected)');
            }
          }
        }
      ]
    );
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset || cloudName.includes('your_cloud_name')) {
      throw new Error("Cloudinary configuration is missing. Please check your .env file.");
    }
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: `proof_${Date.now()}.jpg` } as any);
    formData.append('upload_preset', uploadPreset);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const handleComplete = async (id: string) => {
    if (!accessToken) return;
    Alert.alert('Complete Task', 'You must provide a photo as proof of resolution.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo', onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Camera access is needed for proof.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!result.canceled && result.assets[0]) {
              setLoading(true);
              const imgUrl = await uploadImageToCloudinary(result.assets[0].uri);
              await apiPost(`/assignments/${id}/complete`, { images: [imgUrl] }, accessToken);
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
      const data = await apiGet<{ data: Complaint }>(`/complaints/${assignment.complaintId}`, accessToken);
      setComplaintDetails(data.data);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
    >
      {/* Header */}
      <View style={styles.workerHeader}>
        <View>
          <Text style={styles.workerName}>{user?.name ?? 'Worker'}</Text>
          <Text style={styles.workerRole}>Field Worker</Text>
          {workerLocation && (
            <Text style={styles.locationStatus}><Ionicons name="location-outline" size={20} color="#64748b" /> Location enabled</Text>
          )}
          {locationLoading && (
            <Text style={styles.locationStatus}><Ionicons name="location-outline" size={20} color="#64748b" /> Getting location...</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {onNavigateToNotifications && (
            <Pressable style={styles.notificationBtn} onPress={onNavigateToNotifications}>
              <Text style={styles.notificationIcon}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
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

      {loading ? (
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

    </ScrollView>
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
  notificationIcon: { fontSize: 16 },
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
