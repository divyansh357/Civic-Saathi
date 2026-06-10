import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
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
    color: '#2F3E32',
    bg: '#E1E5E1',
  },
  {
    id: 'worker',
    label: 'Field Worker',
    icon: '👷',
    description: 'Resolve assigned civic complaints',
    color: '#2F3E32',
    bg: '#E1E5E1',
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
      <View style={[fieldStyles.inputWrap, error ? fieldStyles.inputError : null]}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#7F8D82"
          keyboardType={keyboardType}
          secureTextEntry={secure && !show}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secure && (
          <Pressable style={fieldStyles.eyeBtn} onPress={() => setShow((v) => !v)}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={22} color="#4A5D4E" />
          </Pressable>
        )}
      </View>
      {hint && !error && <Text style={fieldStyles.hint}>{hint}</Text>}
      {error && <Text style={fieldStyles.errorHint}>⚠ {error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A5D4E' },
  optional: { fontSize: 12, color: '#7F8D82' },
  inputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#E1E5E1',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1, height: '100%', color: '#2F3E32', fontSize: 16,
  },
  inputError: { borderWidth: 1, borderColor: '#FCA5A5' },
  eyeBtn: {
    height: 56, width: 40,
    alignItems: 'flex-end', justifyContent: 'center',
  },
  hint: { fontSize: 12, color: '#7F8D82', marginTop: 6, paddingHorizontal: 4 },
  errorHint: { fontSize: 12, color: '#DC2626', marginTop: 6, paddingHorizontal: 4 },
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

  const canSubmit =
    selectedRole === 'citizen' ? commonValid :
    selectedRole === 'worker' ? workerValid : false;

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
            <Text style={styles.logoEmoji}>🏙️</Text>
            <Text style={styles.pageTitle}>Let's make change together</Text>
            <Text style={styles.pageSubtitle}>Select your role to get started</Text>
          </View>

          {/* Role cards */}
          <View style={styles.formSection}>
            {ROLES.map((role) => (
              <Pressable
                key={role.id}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.roleCardSelected,
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
                  selectedRole === role.id && styles.radioOuterSelected,
                ]}>
                  {selectedRole === role.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.formSection}>
            <Button
              mode="contained"
              onPress={() => selectedRole && setStep('details')}
              disabled={!selectedRole}
              style={styles.primaryBtn}
              contentStyle={{ height: 56 }}
              labelStyle={styles.primaryBtnText}
              buttonColor="#6A8D73"
            >
              Continue
            </Button>
          </View>

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
      pointerEvents={loading ? 'none' : 'auto'}
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
          <Text style={styles.pageTitle}>Your Details</Text>
          <Text style={styles.pageSubtitle}>Creating a {roleObj.label} account</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Field
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Name"
            autoCapitalize="words"
          />
          <Field
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Field
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            autoCapitalize="none"
            error={phoneError}
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            secure
            autoCapitalize="none"
            error={passwordError}
          />
          <Field
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm Password"
            secure
            autoCapitalize="none"
            error={confirmError}
          />

          {/* ── Worker-specific fields ── */}
          {selectedRole === 'worker' && (
            <>
              <View style={styles.divider} />
              <Field
                label="Designation / Job Title"
                value={designation}
                onChange={setDesignation}
                placeholder="Designation"
                autoCapitalize="words"
              />
              <Field
                label="Department Code"
                value={departmentCode}
                onChange={setDepartmentCode}
                placeholder="Department Code"
                autoCapitalize="characters"
                optional
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
          <Button
            mode="contained"
            onPress={() => { void handleSubmit(); }}
            disabled={!canSubmit || loading}
            loading={loading}
            style={styles.primaryBtn}
            contentStyle={{ height: 56 }}
            labelStyle={styles.primaryBtnText}
            buttonColor="#6A8D73"
          >
            Sign up
          </Button>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Pressable onPress={() => onGoToLogin()}>
            <Text style={styles.switchLink}>Sign in</Text>
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
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 40, width: '100%', position: 'relative' },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E1E5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: '#2F3E32', fontWeight: 'bold' },
  logoEmoji: { fontSize: 48, marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#2F3E32', letterSpacing: -0.5, textAlign: 'center' },
  pageSubtitle: { fontSize: 18, fontWeight: '500', color: '#2F3E32', marginTop: 4, textAlign: 'center' },

  formSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },

  // Role cards
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 16,
  },
  roleCardSelected: {
    borderColor: '#6A8D73',
    backgroundColor: '#F3F4F1',
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIcon: { fontSize: 22 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: '700', color: '#2F3E32' },
  roleDesc: { fontSize: 13, color: '#7F8D82', marginTop: 2 },
  radioOuter: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#C4CBC5',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6A8D73',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6A8D73' },

  divider: { height: 1, backgroundColor: '#E1E5E1', marginVertical: 16 },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 16, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#DC2626', lineHeight: 18 },

  // Buttons
  primaryBtn: {
    height: 56, borderRadius: 28,
    backgroundColor: '#6A8D73',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 18 },

  // Footer
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 15, color: '#4A5D4E' },
  switchLink: { fontSize: 15, fontWeight: '700', color: '#2F3E32', textDecorationLine: 'underline' },
});
