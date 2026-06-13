import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiPut } from '@services/api/client';

/**
 * Mandatory profile completion screen shown to all users immediately after
 * login if their profile is incomplete (missing address or aadhar number).
 * The user cannot access any feature until this is submitted.
 */
export default function CompleteProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [address, setAddress] = useState(user?.address ?? '');
  const [aadharNumber, setAadharNumber] = useState(user?.aadharNumber ?? '');
  const [zoneNumber, setZoneNumber] = useState(
    user?.zoneNumber != null ? String(user.zoneNumber) : ''
  );
  const [saving, setSaving] = useState(false);

  const aadharError = aadharNumber && !/^\d{12}$/.test(aadharNumber)
    ? 'Aadhar must be exactly 12 digits'
    : '';
  const zoneError = zoneNumber && !/^\d+$/.test(zoneNumber)
    ? 'Zone number must be a whole number'
    : '';

  const canSubmit =
    address.trim().length >= 5 &&
    /^\d{12}$/.test(aadharNumber) &&
    /^\d+$/.test(zoneNumber);

  const handleSave = async () => {
    if (!canSubmit || saving || !accessToken || !user) return;
    setSaving(true);
    try {
      const updated = await apiPut<typeof user>(
        '/users/me',
        {
          address: address.trim(),
          aadharNumber: aadharNumber.trim(),
          zoneNumber: parseInt(zoneNumber, 10),
        },
        accessToken,
      );
      // Mark profile as complete and unblock the app
      if (updated) {
        setUser({ ...user, ...updated, profileComplete: true });
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            We need a few more details before you can start using Civic Saathi.
            This information is required for verification.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Address <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="House No., Street, City, State"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Aadhar */}
          <View style={styles.field}>
            <Text style={styles.label}>Aadhar Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, aadharError ? styles.inputError : null]}
              value={aadharNumber}
              onChangeText={(v) => setAadharNumber(v.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhar number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={12}
            />
            {aadharError ? <Text style={styles.errorText}>⚠ {aadharError}</Text> : null}
            <Text style={styles.hint}>Your Aadhar is stored securely and never shared.</Text>
          </View>

          {/* Zone Number */}
          <View style={styles.field}>
            <Text style={styles.label}>Zone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, zoneError ? styles.inputError : null]}
              value={zoneNumber}
              onChangeText={(v) => setZoneNumber(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 4"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
            {zoneError ? <Text style={styles.errorText}>⚠ {zoneError}</Text> : null}
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.btn, (!canSubmit || saving) && styles.btnDisabled]}
            onPress={() => void handleSave()}
            disabled={!canSubmit || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Save & Continue</Text>}
          </Pressable>
        </View>

        {/* Sign out link */}
        <Pressable style={styles.logoutRow} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F1' },
  container: {
    flexGrow: 1, alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 28, width: '100%' },
  emoji: { fontSize: 48, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '800', color: '#2F3E32', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: '#4A5D4E', marginTop: 8,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 8,
  },
  card: {
    width: '100%', maxWidth: 420,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E1E5E1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#4A5D4E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  required: { color: '#DC2626' },
  input: {
    backgroundColor: '#F3F4F1', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E1E5E1', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#2F3E32', minHeight: 48,
  },
  inputError: { borderColor: '#FCA5A5' },
  errorText: { fontSize: 11, color: '#DC2626', marginTop: 4 },
  hint: { fontSize: 11, color: '#7F8D82', marginTop: 4 },
  btn: {
    backgroundColor: '#6A8D73', borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  logoutRow: { marginTop: 20 },
  logoutText: { fontSize: 14, color: '#7F8D82', textDecorationLine: 'underline' },
});
