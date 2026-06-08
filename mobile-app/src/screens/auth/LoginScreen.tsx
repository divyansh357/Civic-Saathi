import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@store/index';
import { isValidEmail } from '@utils/index';

interface Props {
  onGoToSignup: () => void;
  successMessage?: string;
  onClearSuccessMessage?: () => void;
}

export default function LoginScreen({ onGoToSignup, successMessage, onClearSuccessMessage }: Props) {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canLogin = isValidEmail(email.trim()) && password.trim().length > 0;

  const handleLogin = async () => {
    if (!canLogin || isLoading) return;
    await login(email.trim(), password);
    setPassword('');
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
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🏙️</Text>
          </View>
          <Text style={styles.appName}>Civic Saathi</Text>
          <Text style={styles.appTagline}>Citizen issue reporting platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Success message from signup */}
          {successMessage ? (
            <Pressable
              style={styles.successBox}
              onPress={onClearSuccessMessage}
            >
              <Text style={styles.successText}>✓ {successMessage}</Text>
            </Pressable>
          ) : null}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {authError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {authError}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.primaryBtn, (!canLogin || isLoading) && styles.primaryBtnDisabled]}
            onPress={() => { void handleLogin(); }}
            disabled={!canLogin || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Sign In</Text>}
          </Pressable>
        </View>

        {/* Switch to signup */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Pressable onPress={onGoToSignup}>
            <Text style={styles.switchLink}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F4F6FA' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  appTagline: { fontSize: 13, color: '#64748B', marginTop: 4 },
  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  cardSubtitle: { fontSize: 13, color: '#64748B', marginTop: 3, marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    height: 48, borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: 14,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  eyeBtn: {
    height: 48, width: 48,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderLeftWidth: 0,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626' },
  successBox: {
    backgroundColor: '#F0FDF9', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  successText: { fontSize: 13, color: '#065F46', fontWeight: '500' },
  primaryBtn: {
    height: 50, borderRadius: 12,
    backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: '#64748B' },
  switchLink: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
});
