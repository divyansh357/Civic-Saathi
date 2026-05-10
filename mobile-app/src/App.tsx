import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuthStore } from '@store/index';
import { isValidEmail } from '@utils/index';
import { Complaint } from '@/types';
import HomeScreen from '@screens/citizen/HomeScreen';
import NewComplaintScreen from '@screens/citizen/NewComplaintScreen';
import ComplaintDetailScreen from '@screens/citizen/ComplaintDetailScreen';
import WorkerHomeScreen from '@screens/worker/WorkerHomeScreen';

type Screen = 'home' | 'new-complaint' | 'complaint-detail';

export default function App() {
  const hydrateUser = useAuthStore((state) => state.hydrateUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const authError = useAuthStore((state) => state.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const canLogin = isValidEmail(email.trim()) && password.trim().length > 0;

  useEffect(() => {
    hydrateUser()
      .catch(() => { /* ignore */ })
      .finally(() => setBootstrapped(true));
  }, [hydrateUser]);

  const handleLogin = async () => {
    if (!canLogin) return;
    await login(email.trim(), password);
    setPassword('');
  };

  // Loading / bootstrap
  if (!bootstrapped || isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingLogo}>🏙️</Text>
        <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Civic Saathi</Text>
      </SafeAreaView>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginContent}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginLogo}>🏙️</Text>
            <Text style={styles.loginTitle}>Civic Saathi</Text>
            <Text style={styles.loginSubtitle}>Citizen issue reporting platform</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="citizen@civic.com"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
            />

            <Pressable
              style={[styles.loginBtn, !canLogin && styles.loginBtnDisabled]}
              onPress={() => { void handleLogin(); }}
              disabled={!canLogin}
            >
              <Text style={styles.loginBtnText}>Sign In</Text>
            </Pressable>

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          </View>

          <Text style={styles.demoHint}>
            Demo: citizen@civic.com / password
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Worker view
  if (user?.role === 'WORKER') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <WorkerHomeScreen />
      </SafeAreaView>
    );
  }

  // Citizen / other views
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {screen === 'home' && (
        <HomeScreen
          onNewComplaint={() => setScreen('new-complaint')}
          onComplaintDetail={(c) => { setSelectedComplaint(c); setScreen('complaint-detail'); }}
        />
      )}

      {screen === 'new-complaint' && (
        <NewComplaintScreen
          onBack={() => setScreen('home')}
          onSuccess={() => setScreen('home')}
        />
      )}

      {screen === 'complaint-detail' && selectedComplaint && (
        <ComplaintDetailScreen
          complaint={selectedComplaint}
          onBack={() => setScreen('home')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  loadingContainer: {
    flex: 1, backgroundColor: '#F4F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingLogo: { fontSize: 48 },
  loadingText: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  loginContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  loginHeader: { alignItems: 'center', marginBottom: 32 },
  loginLogo: { fontSize: 52, marginBottom: 12 },
  loginTitle: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  loginSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  formCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 8 },
  input: {
    height: 46, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: 14,
  },
  loginBtn: {
    marginTop: 16, height: 46, borderRadius: 10,
    backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  errorText: { marginTop: 10, color: '#DC2626', textAlign: 'center', fontSize: 13 },
  demoHint: { marginTop: 20, fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});
