import { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, IconButton, Surface, TouchableRipple } from 'react-native-paper';
import { apiPost } from '@services/api/client';
import { isValidEmail } from '@utils/index';

// ─── Role definitions ─────────────────────────────────────────────────────────

interface RoleOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'citizen',
    label: 'Citizen',
    icon: 'account',
    description: 'Report civic issues in your area',
  },
  {
    id: 'worker',
    label: 'Field Worker',
    icon: 'hard-hat',
    description: 'Resolve assigned civic complaints',
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
      <TextInput
        mode="outlined"
        label={label + (optional ? ' (optional)' : '')}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secure && !show}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        error={!!error}
        right={secure ? <TextInput.Icon icon={show ? "eye-off" : "eye"} onPress={() => setShow(!show)} /> : undefined}
      />
      {hint && !error && <HelperText type="info" visible>{hint}</HelperText>}
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 12 },
});

// ─── Main SignupScreen ────────────────────────────────────────────────────────

interface Props {
  onGoToLogin: (successMessage?: string) => void;
}

export default function SignupScreen({ onGoToLogin }: Props) {
  const theme = useTheme();
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
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>🏙️</Text>
            <Text variant="headlineMedium" style={styles.pageTitle}>Let&apos;s make change together</Text>
            <Text variant="titleMedium" style={styles.pageSubtitle}>Select your role to get started</Text>
          </View>

          {/* Role cards */}
          <View style={styles.formSection}>
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <Surface
                  key={role.id}
                  style={[
                    styles.roleCard,
                    isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
                    !isSelected && { borderColor: theme.colors.surfaceVariant, backgroundColor: theme.colors.surface },
                  ]}
                  elevation={isSelected ? 2 : 1}
                >
                  <TouchableRipple
                    style={styles.roleCardRipple}
                    onPress={() => setSelectedRole(role.id)}
                    borderless
                  >
                    <>
                      <View style={[styles.roleIconWrap, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                        <IconButton icon={role.icon} iconColor={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} size={24} />
                      </View>
                      <View style={styles.roleInfo}>
                        <Text variant="titleMedium" style={{ color: isSelected ? theme.colors.primary : theme.colors.onSurface }}>
                          {role.label}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{role.description}</Text>
                      </View>
                    </>
                  </TouchableRipple>
                </Surface>
              );
            })}
          </View>

          <View style={styles.formSection}>
            <Button
              mode="contained"
              onPress={() => selectedRole && setStep('details')}
              disabled={!selectedRole}
              style={styles.primaryBtn}
              contentStyle={styles.primaryBtnContent}
            >
              Continue
            </Button>
          </View>

          <View style={styles.switchRow}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <Pressable onPress={() => onGoToLogin()}>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign in</Text>
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
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => setStep('role')}
            style={styles.backBtn}
          />
          <Text variant="headlineMedium" style={styles.pageTitle}>Your Details</Text>
          <Text variant="titleMedium" style={styles.pageSubtitle}>Creating a {roleObj.label} account</Text>
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
              <View style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />
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
            <Surface style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ color: theme.colors.onErrorContainer }}>⚠ {apiError}</Text>
            </Surface>
          ) : null}

          {/* Submit */}
          <Button
            mode="contained"
            onPress={() => { void handleSubmit(); }}
            loading={loading}
            disabled={!canSubmit || loading}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
          >
            Sign up
          </Button>
        </View>

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Already have an account? </Text>
          <Pressable onPress={() => onGoToLogin()}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 32, width: '100%', position: 'relative' },
  backBtn: {
    position: 'absolute',
    left: -12,
    top: -8,
  },
  logoEmoji: { fontSize: 48, marginBottom: 16 },
  pageTitle: { fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  pageSubtitle: { textAlign: 'center', opacity: 0.8 },

  formSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },

  // Role cards
  roleCard: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  roleCardRipple: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  roleInfo: { flex: 1, justifyContent: 'center' },

  divider: { height: 1, marginVertical: 24 },

  // Error
  errorBox: {
    borderRadius: 12, padding: 12, marginBottom: 16,
  },

  // Buttons
  primaryBtn: {
    marginTop: 8,
    borderRadius: 8,
  },
  primaryBtnContent: {
    height: 52,
  },

  // Footer
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});
