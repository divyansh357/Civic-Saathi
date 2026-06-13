import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiPut } from '@services/api/client';

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [aadharNumber, setAadharNumber] = useState(user?.aadharNumber ?? '');
  const [zoneNumber, setZoneNumber] = useState(
    user?.zoneNumber != null ? String(user.zoneNumber) : ''
  );
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) {
      Alert.alert('Validation', 'Aadhar number must be exactly 12 numeric digits.');
      return;
    }
    if (!accessToken || !user) return;
    setSaving(true);
    try {
      const updated = await apiPut<typeof user>(
        '/users/me',
        {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          aadharNumber: aadharNumber.trim() || undefined,
          zoneNumber: zoneNumber ? parseInt(zoneNumber, 10) : undefined,
        },
        accessToken
      );
      if (updated) setUser(updated);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } finally { setLoggingOut(false); }
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    CITIZEN: 'Citizen',
    WORKER: 'Field Worker',
    OFFICER: 'Officer',
    ADMIN: 'Administrator',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel[user?.role ?? 'CITIZEN'] ?? user?.role}</Text>
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Edit form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit Profile</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#94A3B8"
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full Address</Text>
            <TextInput
              style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
              value={address}
              onChangeText={setAddress}
              placeholder="House No., Street, City, State"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Aadhar Number</Text>
            <TextInput
              style={[styles.input, aadharNumber && !/^\d{12}$/.test(aadharNumber) ? styles.inputError : null]}
              value={aadharNumber}
              onChangeText={(v) => setAadharNumber(v.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhar number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={12}
            />
            {aadharNumber && aadharNumber.length < 12 && (
              <Text style={styles.errorHint}>⚠ Aadhar must be exactly 12 digits ({aadharNumber.length}/12)</Text>
            )}
            {user?.aadharNumber ? (
              <Text style={styles.hint}>Aadhar is locked and cannot be changed.</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Zone Number</Text>
            <TextInput
              style={styles.input}
              value={zoneNumber}
              onChangeText={(v) => setZoneNumber(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 4"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.input, styles.readOnly]}>
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </View>

        {/* Account info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>{roleLabel[user?.role ?? 'CITIZEN'] ?? user?.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{user?.city ?? 'Not set'}</Text>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.logoutText}>Sign Out</Text>
          )}
        </Pressable>
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
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  roleBadge: {
    backgroundColor: '#F0FDF9', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 6,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#0F766E' },
  userEmail: { fontSize: 13, color: '#64748B' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 14 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0F172A',
  },
  readOnly: { justifyContent: 'center' },
  readOnlyText: { fontSize: 14, color: '#94A3B8' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  inputError: { borderColor: '#FCA5A5', borderWidth: 1.5 },
  errorHint: { fontSize: 11, color: '#DC2626', marginTop: 4 },

  saveBtn: {
    backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: '#94A3B8' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  infoLabel: { fontSize: 13, color: '#64748B' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  logoutBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
