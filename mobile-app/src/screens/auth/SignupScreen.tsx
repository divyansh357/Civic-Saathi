import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { apiPost } from '@services/api/client';
import { isValidEmail } from '@utils/index';
import Checkbox from '@components/Checkbox';
import CityPickerModal, { City } from '@components/CityPickerModal';
import DepartmentPickerModal, { Department } from '@components/DepartmentPickerModal';

// ─── Country codes ────────────────────────────────────────────────────────────

interface CountryCode {
  code: string;
  flag: string;
  label: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91',  flag: '🇮🇳', label: 'IN +91'  },
  { code: '+1',   flag: '🇺🇸', label: 'US +1'   },
  { code: '+44',  flag: '🇬🇧', label: 'UK +44'  },
  { code: '+61',  flag: '🇦🇺', label: 'AU +61'  },
  { code: '+971', flag: '🇦🇪', label: 'AE +971' },
];

// ─── Role definitions ─────────────────────────────────────────────────────────

interface RoleOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'citizen',
    label: 'Citizen',
    icon: <Ionicons name="person-outline" size={20} color="#64748b" />,
    description: 'Report civic issues in your area',
  },
  {
    id: 'worker',
    label: 'Field Worker',
    icon: <Ionicons name="construct-outline" size={20} color="#64748b" />,
    description: 'Resolve assigned civic complaints',
  },
];

// ─── Reusable Field ───────────────────────────────────────────────────────────

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
  maxLength?: number;
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default',
  secure = false, autoCapitalize = 'sentences', hint, error, optional, maxLength,
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
          maxLength={maxLength}
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E1E5E1', borderRadius: 16,
    height: 56, paddingHorizontal: 16,
  },
  input: { flex: 1, height: '100%', color: '#2F3E32', fontSize: 16 },
  inputError: { borderWidth: 1, borderColor: '#FCA5A5' },
  eyeBtn: { height: 56, width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  hint: { fontSize: 12, color: '#7F8D82', marginTop: 6, paddingHorizontal: 4 },
  errorHint: { fontSize: 12, color: '#DC2626', marginTop: 6, paddingHorizontal: 4 },
});

// ─── Phone field with country code ───────────────────────────────────────────

interface PhoneFieldProps {
  countryCode: string;
  onCountryCodeChange: (c: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  error?: string;
}

function PhoneField({ countryCode, onCountryCodeChange, phone, onPhoneChange, error }: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <View style={fieldStyles.group}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>Phone Number (10 digits)</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Country code picker */}
        <Pressable
          style={[phoneStyles.codeBtn, error ? fieldStyles.inputError : null]}
          onPress={() => setOpen((v) => !v)}
        >
          <Text style={phoneStyles.codeBtnText}>{selected.flag} {selected.code}</Text>
          <Ionicons name="chevron-down" size={14} color="#4A5D4E" />
        </Pressable>
        {/* Phone digits */}
        <View style={[fieldStyles.inputWrap, { flex: 1 }, error ? fieldStyles.inputError : null]}>
          <TextInput
            style={fieldStyles.input}
            value={phone}
            onChangeText={(v) => onPhoneChange(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            placeholderTextColor="#7F8D82"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      </View>
      {/* Dropdown */}
      {open && (
        <View style={phoneStyles.dropdown}>
          {COUNTRY_CODES.map((c) => (
            <Pressable
              key={c.code}
              style={phoneStyles.dropdownItem}
              onPress={() => { onCountryCodeChange(c.code); setOpen(false); }}
            >
              <Text style={phoneStyles.dropdownText}>{c.flag} {c.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {error && <Text style={fieldStyles.errorHint}>⚠ {error}</Text>}
    </View>
  );
}

const phoneStyles = StyleSheet.create({
  codeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E1E5E1', borderRadius: 16,
    height: 56, paddingHorizontal: 14,
  },
  codeBtnText: { fontSize: 14, fontWeight: '600', color: '#2F3E32' },
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1,
    borderColor: '#E1E5E1', marginTop: 4, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F1' },
  dropdownText: { fontSize: 14, color: '#2F3E32' },
});

// ─── Main SignupScreen ────────────────────────────────────────────────────────

interface Props {
  onGoToLogin: (successMessage?: string) => void;
}

export default function SignupScreen({ onGoToLogin }: Props) {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zoneNumber, setZoneNumber] = useState('');
  
  const [cityId, setCityId] = useState('');
  const [cityName, setCityName] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Worker-specific
  const [designation, setDesignation] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Validation ──────────────────────────────────────────────────────────────

  const emailError   = email && !isValidEmail(email) ? 'Enter a valid email address' : '';
  const workerEmailError =
    selectedRole === 'worker' && email && !email.trim().toLowerCase().endsWith('@municipal.in')
      ? 'Field workers must use a @municipal.in email'
      : '';
  const phoneError   = phone && phone.length < 10 ? 'Phone must be exactly 10 digits' : '';
  const passwordError = password && password.length < 8 ? 'Password must be at least 8 characters' : '';
  const confirmError  = confirmPassword && confirmPassword !== password ? 'Passwords do not match' : '';
  const zoneError     = zoneNumber && !/^\d+$/.test(zoneNumber.trim()) ? 'Zone must be a whole number' : '';

  const phoneOk = phone.length === 10;

  const commonValid =
    name.trim().length >= 2 &&
    isValidEmail(email.trim()) &&
    (selectedRole !== 'worker' || email.trim().toLowerCase().endsWith('@municipal.in')) &&
    phoneOk &&
    password.length >= 8 &&
    password === confirmPassword &&
    /^\d+$/.test(zoneNumber.trim()) &&
    cityId !== '';

  const workerValid = commonValid && designation.trim().length >= 2;

  const canSubmit =
    selectedRole === 'citizen' ? commonValid :
    selectedRole === 'worker'  ? workerValid : false;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setApiError('');

    const payload: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      phone: `${countryCode}${phone}`,
      password,
      role: selectedRole,
      zoneNumber: parseInt(zoneNumber, 10),
      cityId,
    };

    if (selectedRole === 'worker') {
      payload.designation = designation.trim();
      if (departmentCode.trim()) payload.departmentCode = departmentCode.trim().toUpperCase();
    }

    try {
      if (selectedRole === 'worker') {
        await apiPost('/auth/worker-signup', payload);
      } else {
        await apiPost('/auth/signup', payload);
      }
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
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Let's make change together</Text>
            <Text style={styles.pageSubtitle}>Select your role to get started</Text>
          </View>

          <View style={styles.formSection}>
            {ROLES.map((role) => (
              <Pressable
                key={role.id}
                style={[styles.roleCard, selectedRole === role.id && styles.roleCardSelected]}
                onPress={() => setSelectedRole(role.id)}
              >
                <View style={styles.roleIconWrap}>
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleLabel, selectedRole === role.id && { color: '#2F3E32' }]}>
                    {role.label}
                  </Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
                <View style={[styles.radioOuter, selectedRole === role.id && styles.radioOuterSelected]}>
                  {selectedRole === role.id && <View style={styles.radioInner} />}
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
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => setStep('role')}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Your Details</Text>
          <Text style={styles.pageSubtitle}>
            Creating a {selectedRole === 'citizen' ? 'Citizen' : 'Field Worker'} account
          </Text>
        </View>

        <View style={styles.formSection}>
          <Field label="Full Name" value={name} onChange={setName} placeholder="Name" autoCapitalize="words" />

          <Field
            label={selectedRole === 'worker' ? 'Email Address (@municipal.in)' : 'Email Address'}
            value={email}
            onChange={setEmail}
            placeholder={selectedRole === 'worker' ? 'name@municipal.in' : 'name@example.com'}
            keyboardType="email-address"
            autoCapitalize="none"
            error={workerEmailError || emailError}
            hint={selectedRole === 'worker' ? 'Field workers must use a @municipal.in email' : undefined}
          />

          <PhoneField
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            phone={phone}
            onPhoneChange={setPhone}
            error={phoneError}
          />

          <View style={fieldStyles.group}>
            <View style={fieldStyles.labelRow}>
              <Text style={fieldStyles.label}>City</Text>
            </View>
            <Pressable 
              style={[fieldStyles.inputWrap, { justifyContent: 'center' }]} 
              onPress={() => setShowCityPicker(true)}
            >
              <Text style={{ fontSize: 16, color: cityName ? '#2F3E32' : '#7F8D82' }}>
                {cityName || 'Select your city'}
              </Text>
            </Pressable>
          </View>

          <Field
            label="Zone Number"
            value={zoneNumber}
            onChange={(v) => setZoneNumber(v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 4"
            keyboardType="numeric"
            autoCapitalize="none"
            error={zoneError}
          />

          <Field label="Password" value={password} onChange={setPassword}
            placeholder="Password" secure autoCapitalize="none" error={passwordError} />
          <Field label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword}
            placeholder="Confirm Password" secure autoCapitalize="none" error={confirmError} />

          {selectedRole === 'worker' && (
            <>
              <View style={styles.divider} />
              <Field label="Designation / Job Title" value={designation} onChange={setDesignation}
                placeholder="Designation" autoCapitalize="words" />
              <View style={fieldStyles.group}>
                <View style={fieldStyles.labelRow}>
                  <Text style={fieldStyles.label}>Department</Text>
                </View>
                <Pressable
                  style={[fieldStyles.inputWrap, { justifyContent: 'center' }]}
                  onPress={() => setShowDepartmentPicker(true)}
                >
                  <Text style={{ fontSize: 16, color: departmentName ? '#2F3E32' : '#7F8D82' }}>
                    {departmentName || 'Select your department'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {apiError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {apiError}</Text>
            </View>
          ) : null}

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

      <CityPickerModal
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        selectedCityId={cityId}
        onSelect={(city) => {
          setCityId(city.id);
          setCityName(city.name);
          setShowCityPicker(false);
        }}
      />
      <DepartmentPickerModal
        visible={showDepartmentPicker}
        onClose={() => setShowDepartmentPicker(false)}
        selectedDepartmentId={departmentCode}
        onSelect={(dept) => {
          setDepartmentCode(dept.id);
          setDepartmentName(dept.name);
          setShowDepartmentPicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F1' },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40, width: '100%', position: 'relative' },
  backBtn: {
    position: 'absolute', left: 0, top: 4,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E1E5E1', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: '#2F3E32', fontWeight: 'bold' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#2F3E32', letterSpacing: -0.5, textAlign: 'center' },
  pageSubtitle: { fontSize: 16, fontWeight: '500', color: '#2F3E32', marginTop: 4, textAlign: 'center' },
  formSection: { width: '100%', maxWidth: 400, marginBottom: 20 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16,
  },
  roleCardSelected: { borderColor: '#6A8D73', backgroundColor: '#F3F4F1' },
  roleIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E1E5E1', alignItems: 'center', justifyContent: 'center' },
  roleIcon: { fontSize: 22 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: '700', color: '#2F3E32' },
  roleDesc: { fontSize: 13, color: '#7F8D82', marginTop: 2 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4CBC5', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#6A8D73' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6A8D73' },
  divider: { height: 1, backgroundColor: '#E1E5E1', marginVertical: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#DC2626', lineHeight: 18 },
  primaryBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 15, color: '#4A5D4E' },
  switchLink: { fontSize: 15, fontWeight: '700', color: '#2F3E32', textDecorationLine: 'underline' },
});
