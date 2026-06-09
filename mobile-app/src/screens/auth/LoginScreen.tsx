import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const emailError = email && !isValidEmail(email.trim()) ? 'Enter a valid email address' : '';
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
        {/* Logo & Header */}
        <View style={styles.headerSection}>
          <Text style={styles.logoEmoji}>🏙️</Text>
          <Text style={styles.headerTitle}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Sign in to your account</Text>
        </View>

        {/* Success message from signup */}
        {successMessage ? (
          <Pressable
            style={styles.successBox}
            onPress={onClearSuccessMessage}
          >
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </Pressable>
        ) : null}

        {/* Inputs Section */}
        <View style={styles.formSection}>
          {/* Email */}
          <View style={[styles.inputWrap, emailError ? styles.inputError : null]}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#7F8D82"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>
          {emailError ? <Text style={styles.errorHint}>⚠ {emailError}</Text> : null}

          {/* Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#7F8D82"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#4A5D4E" />
            </Pressable>
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
              : <Text style={styles.primaryBtnText}>Login</Text>}
          </Pressable>
        </View>

        {/* Switch to signup */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Pressable onPress={onGoToSignup}>
            <Text style={styles.switchLink}>Create new account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F1' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 40,
    marginTop: 20
  },
  logoEmoji: { 
    fontSize: 48, 
    marginBottom: 16 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#2F3E32', 
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#2F3E32', 
    marginTop: 4 
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1E5E1',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#4A5D4E',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#2F3E32',
    fontSize: 16,
  },
  inputError: { borderWidth: 1, borderColor: '#FCA5A5' },
  errorHint: { fontSize: 12, color: '#DC2626', marginTop: -10, marginBottom: 6, paddingHorizontal: 4 },
  eyeBtn: {
    height: 56, width: 40,
    alignItems: 'flex-end', justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 16, padding: 12, marginTop: -4, marginBottom: 8,
  },
  errorText: { fontSize: 13, color: '#DC2626' },
  successBox: {
    backgroundColor: '#F0FDF9', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 16, padding: 12, marginBottom: 20, width: '100%', maxWidth: 400,
  },
  successText: { fontSize: 13, color: '#065F46', fontWeight: '500' },
  primaryBtn: {
    height: 56, 
    borderRadius: 28,
    backgroundColor: '#6A8D73',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40 },
  switchText: { fontSize: 15, color: '#4A5D4E' },
  switchLink: { fontSize: 15, fontWeight: '700', color: '#2F3E32', textDecorationLine: 'underline' },
});
