import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { apiPost } from '@services/api/client';
import { isValidEmail } from '@utils/index';

// ─── Role definitions ─────────────────────────────────────────────────────────

interface RoleOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'citizen',
    label: 'Citizen',
    icon: '👤',
    description: 'Report civic issues in your area',
    color: '#0F766E',
    bg: '#F0FDF9',
  },
  {
    id: 'worker',
    label: 'Field Worker',
    icon: '👷',
    description: 'Resolve assigned civic complaints',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 'admin',
    label: 'Admin / Officer',
    icon: '🏛️',
    description: 'Manage departments and assignments',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
];

// ─── Field component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hint?: string;
  error?: string;
  optional?: boolean;
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default',
  secure = false, autoCapitalize = 'sentences', hint, error, optional,
}: FieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View style={fieldStyles.group}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {optional && <Text style={fieldStyles.optional}>optional</Text>}
      </View>
      <View style={fieldStyles.inputWrap}>
        <TextInput
          style={[
            fieldStyles.input,
            secure && fieldStyles.inputWithEye,
            error ? fieldStyles.inputError : null,
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          secureTextEntry={secure && !show}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secure && (
          <Pressable style={fieldStyles.eyeBtn} onPress={() => setShow((v) => !v)}>
            <Text style={fieldStyles.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}
      </View>
      {hint && !error && <Text style={fieldStyles.hint}>{hint}</Text>}
      {error && <Text style={fieldStyles.errorHint}>⚠ {error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  optional: { fontSize: 11, color: '#94A3B8' },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, height: 48, borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: 14,
  },
  inputWithEye: { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  inputError: { borderColor: '#FCA5A5' },
  eyeBtn: {
    height: 48, width: 48,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderLeftWidth: 0,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  errorHint: { fontSize: 11, color: '#DC2626', marginTop: 4 },
});

// ─── Main SignupScreen ────────────────────────────────────────────────────────

interface Props {
  onGoToLogin: (successMessage?: string) => void;
}

export default function SignupScreen({ onGoToLogin }: Props) {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Worker-specific
  const [designation, setDesignation] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');

  // Admin-specific
  const [city, setCity] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Validation ──────────────────────────────────────────────────────────────

  const emailError = email && !isValidEmail(email) ? 'Enter a valid email address' : '';
  const phoneError = phone && phone.replace(/\D/g, '').length < 10 ? 'Enter a valid 10-digit phone number' : '';
  const passwordError = password && password.length < 8 ? 'Password must be at least 8 characters' : '';
  const confirmError = confirmPassword && confirmPassword !== password ? 'Passwords do not match' : '';

  const commonValid =
    name.trim().length >= 2 &&
    isValidEmail(email.trim()) &&
    phone.replace(/\D/g, '').length >= 10 &&
    password.length >= 8 &&
    password === confirmPassword;

  const workerValid = commonValid && designation.trim().length >= 2;
  const adminValid = commonValid && city.trim().length >= 2;

  const canSubmit =
    selectedRole === 'citizen' ? commonValid :
    selectedRole === 'worker' ? workerValid :
    selectedRole === 'admin' ? adminValid : false;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setApiError('');

    const payload: Record<string, string> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role: selectedRole,
    };

    if (selectedRole === 'worker') {
      payload.designation = designation.trim();
      if (departmentCode.trim()) payload.departmentCode = departmentCode.trim();
    }

    if (selectedRole === 'admin') {
      payload.city = city.trim();
      if (adminCode.trim()) payload.adminCode = adminCode.trim();
    }

    try {
      await apiPost('/auth/signup', payload);
      onGoToLogin(`Account created! Sign in as ${name.trim().split(' ')[0]}.`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Role selection step ─────────────────────────────────────────────────────

  if (step === 'role') {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => onGoToLogin()}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏙️</Text>
            </View>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Choose your role to get started</Text>
          </View>

          {/* Role cards */}
          <View style={styles.roleList}>
            {ROLES.map((role) => (
              <Pressable
                key={role.id}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && { borderColor: role.color, backgroundColor: role.bg },
                ]}
                onPress={() => setSelectedRole(role.id)}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: role.bg }]}>
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleLabel, selectedRole === role.id && { color: role.color }]}>
                    {role.label}
                  </Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
                <View style={[
                  styles.radioOuter,
                  selectedRole === role.id && { borderColor: role.color },
                ]}>
                  {selectedRole === role.id && (
                    <View style={[styles.radioInner, { backgroundColor: role.color }]} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.primaryBtn, !selectedRole && styles.primaryBtnDisabled]}
            onPress={() => selectedRole && setStep('details')}
            disabled={!selectedRole}
          >
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Pressable onPress={() => onGoToLogin()}>
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Details step ────────────────────────────────────────────────────────────

  const roleObj = ROLES.find((r) => r.id === selectedRole)!;

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
          <Pressable style={styles.backBtn} onPress={() => setStep('role')}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={[styles.rolePill, { backgroundColor: roleObj.bg }]}>
            <Text style={styles.rolePillIcon}>{roleObj.icon}</Text>
            <Text style={[styles.rolePillText, { color: roleObj.color }]}>{roleObj.label}</Text>
          </View>
          <Text style={styles.pageTitle}>Your Details</Text>
          <Text style={styles.pageSubtitle}>Fill in your information to create your account</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          {/* ── Common fields ── */}
          <Text style={styles.sectionLabel}>Personal Information</Text>

          <Field
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Rahul Sharma"
            autoCapitalize="words"
          />
          <Field
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="rahul@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Field
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            placeholder="9876543210"
            keyboardType="phone-pad"
            autoCapitalize="none"
            error={phoneError}
          />

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Security</Text>

          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Min 8 characters"
            secure
            autoCapitalize="none"
            hint="Use letters, numbers and symbols for a strong password"
            error={passwordError}
          />
          <Field
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat your password"
            secure
            autoCapitalize="none"
            error={confirmError}
          />

          {/* ── Worker-specific fields ── */}
          {selectedRole === 'worker' && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Work Details</Text>
              <Field
                label="Designation / Job Title"
                value={designation}
                onChange={setDesignation}
                placeholder="e.g. Field Engineer, Plumber"
                autoCapitalize="words"
              />
              <Field
                label="Department Code"
                value={departmentCode}
                onChange={setDepartmentCode}
                placeholder="e.g. ROADS, WATER (ask your supervisor)"
                autoCapitalize="characters"
                optional
                hint="Leave blank if you don't know — admin will assign you"
              />
            </>
          )}

          {/* ── Admin-specific fields ── */}
          {selectedRole === 'admin' && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Administrative Details</Text>
              <Field
                label="City / Municipality"
                value={city}
                onChange={setCity}
                placeholder="e.g. Bengaluru"
                autoCapitalize="words"
              />
              <Field
                label="Admin Authorization Code"
                value={adminCode}
                onChange={setAdminCode}
                placeholder="Provided by your organization"
                autoCapitalize="characters"
                optional
                hint="Contact your system administrator if you don't have this"
              />
            </>
          )}

          {/* API error */}
          {apiError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {apiError}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.primaryBtn, (!canSubmit || loading) && styles.primaryBtnDisabled]}
            onPress={() => { void handleSubmit(); }}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Pressable onPress={() => onGoToLogin()}>
            <Text style={styles.switchLink}>Sign in</Text>
          </Pressable>
        </View>

        {/* Terms note */}
        <Text style={styles.termsNote}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F4F6FA' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 24, width: '100%' },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  backIcon: { fontSize: 18, color: '#0F172A' },
  logoCircle: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  logoEmoji: { fontSize: 30 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 12,
  },
  rolePillIcon: { fontSize: 16 },
  rolePillText: { fontSize: 13, fontWeight: '700' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },

  // Role cards
  roleList: { width: '100%', gap: 10, marginBottom: 20 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIcon: { fontSize: 22 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  roleDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  // Form card
  card: {
    width: '100%', maxWidth: 440,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626', lineHeight: 18 },

  // Buttons
  primaryBtn: {
    height: 52, borderRadius: 14,
    backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Footer
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: '#64748B' },
  switchLink: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  termsNote: {
    fontSize: 11, color: '#94A3B8', textAlign: 'center',
    marginTop: 16, lineHeight: 16, paddingHorizontal: 20,
  },
});
