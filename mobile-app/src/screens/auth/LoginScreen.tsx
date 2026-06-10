import { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
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
  const theme = useTheme();

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
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Header */}
        <View style={styles.headerSection}>
          <View style={[styles.logoBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.logoEmoji}>🏙️</Text>
          </View>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Welcome back
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Sign in to your account
          </Text>
        </View>

        {/* Success message from signup */}
        {successMessage ? (
          <Pressable
            style={[styles.successBox, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }]}
            onPress={onClearSuccessMessage}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '500', fontSize: 13 }}>
              ✓ {successMessage}
            </Text>
          </Pressable>
        ) : null}

        {/* Form */}
        <View style={styles.formSection}>
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            left={<TextInput.Icon icon="email-outline" />}
            error={!!emailError}
            outlineStyle={styles.inputOutline}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            autoComplete="password"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            outlineStyle={styles.inputOutline}
          />

          {/* Error */}
          {authError ? (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
              <Text style={{ fontSize: 13, color: theme.colors.error }}>⚠ {authError}</Text>
            </View>
          ) : null}

          {/* Submit — M3 filled button */}
          <Button
            mode="contained"
            onPress={() => { void handleLogin(); }}
            disabled={!canLogin || isLoading}
            loading={isLoading}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
            labelStyle={styles.primaryBtnLabel}
          >
            Login
          </Button>
        </View>

        {/* Switch to signup */}
        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Don&apos;t have an account?{' '}
          </Text>
          <Button mode="text" onPress={onGoToSignup} compact labelStyle={styles.switchLink}>
            Create new account
          </Button>
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
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 36 },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
  },
  inputOutline: {
    borderRadius: 12,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  successBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  primaryBtn: {
    marginTop: 12,
    borderRadius: 24,
  },
  primaryBtnContent: {
    height: 52,
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  switchLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});
