import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '@store/index';
import { Complaint } from '@/types';
import { notificationService } from '@services/notifications';

// Auth screens
import LoginScreen from '@screens/auth/LoginScreen';
import SignupScreen from '@screens/auth/SignupScreen';

// Citizen screens
import HomeScreen from '@screens/citizen/HomeScreen';
import NewComplaintScreen from '@screens/citizen/NewComplaintScreen';
import ComplaintDetailScreen from '@screens/citizen/ComplaintDetailScreen';
import FeedbackScreen from '@screens/citizen/FeedbackScreen';

// Worker screens
import WorkerHomeScreen from '@screens/worker/WorkerHomeScreen';

// Shared screens
import NotificationsScreen from '@screens/NotificationsScreen';

// ─── Screen types ─────────────────────────────────────────────────────────────

type AuthScreen = 'login' | 'signup';
type CitizenScreen = 'home' | 'new-complaint' | 'complaint-detail' | 'notifications' | 'feedback';
type WorkerScreen = 'home' | 'notifications';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Citizen navigation
  const [citizenScreen, setCitizenScreen] = useState<CitizenScreen>('home');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Worker navigation
  const [workerScreen, setWorkerScreen] = useState<WorkerScreen>('home');

  // Bootstrap: restore session from storage
  useEffect(() => {
    hydrateUser()
      .catch(() => { /* ignore — store handles error state */ })
      .finally(() => setBootstrapped(true));
  }, [hydrateUser]);

  // Initialize notification service when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.initialize().then((success) => {
        if (success) {
          notificationService.requestPermissions();
          
          // Simulate some initial notifications for Level A demo
          setTimeout(() => {
            if (user?.role === 'CITIZEN') {
              notificationService.notifyComplaintStatusUpdate(
                'C-1001', 
                'ASSIGNED', 
                'Pothole on MG Road'
              );
            } else if (user?.role === 'WORKER') {
              notificationService.notifyNewAssignment(
                'A-001',
                'Water supply disruption in Koramangala'
              );
            }
          }, 3000);
        }
      });
    }
  }, [isAuthenticated, user?.role]);

  // ── Loading splash ──────────────────────────────────────────────────────────

  if (!bootstrapped || isLoading) {
    return (
      <SafeAreaView style={styles.splash}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
        <View style={styles.splashContent}>
          <View style={styles.splashLogo}>
            <Text style={styles.splashEmoji}>🏙️</Text>
          </View>
          <Text style={styles.splashTitle}>Civic Saathi</Text>
          <ActivityIndicator
            size="large"
            color="#0F766E"
            style={{ marginTop: 24 }}
          />
          <Text style={styles.splashSubtitle}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Auth screens ────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
          <SignupScreen
            onGoToLogin={(successMsg) => {
              if (successMsg) setLoginSuccessMsg(successMsg);
              setAuthScreen('login');
            }}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
        <LoginScreen
          successMessage={loginSuccessMsg}
          onClearSuccessMessage={() => setLoginSuccessMsg('')}
          onGoToSignup={() => {
            setLoginSuccessMsg('');
            setAuthScreen('signup');
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Worker view ─────────────────────────────────────────────────────────────

  if (user?.role === 'WORKER') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
        
        {workerScreen === 'home' && (
          <WorkerHomeScreen onNavigateToNotifications={() => setWorkerScreen('notifications')} />
        )}
        
        {workerScreen === 'notifications' && (
          <NotificationsScreen onBack={() => setWorkerScreen('home')} />
        )}
      </SafeAreaView>
    );
  }

  // ── Admin / Officer view ────────────────────────────────────────────────────
  // Admins use the web dashboard; on mobile show a redirect notice

  if (user?.role === 'ADMIN' || user?.role === 'OFFICER') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
        <AdminNoticeScreen userName={user.name} onLogout={() => useAuthStore.getState().logout()} />
      </SafeAreaView>
    );
  }

  // ── Citizen view ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />

      {citizenScreen === 'home' && (
        <HomeScreen
          onNewComplaint={() => setCitizenScreen('new-complaint')}
          onComplaintDetail={(c) => {
            setSelectedComplaint(c);
            setCitizenScreen('complaint-detail');
          }}
          onNavigateToNotifications={() => setCitizenScreen('notifications')}
        />
      )}

      {citizenScreen === 'new-complaint' && (
        <NewComplaintScreen
          onBack={() => setCitizenScreen('home')}
          onSuccess={() => setCitizenScreen('home')}
        />
      )}

      {citizenScreen === 'complaint-detail' && selectedComplaint && (
        <ComplaintDetailScreen
          complaint={selectedComplaint}
          onBack={() => setCitizenScreen('home')}
          onFeedback={(c) => {
            setSelectedComplaint(c);
            setCitizenScreen('feedback');
          }}
        />
      )}

      {citizenScreen === 'feedback' && selectedComplaint && (
        <FeedbackScreen
          complaint={selectedComplaint}
          onBack={() => setCitizenScreen('complaint-detail')}
          onSuccess={() => setCitizenScreen('home')}
        />
      )}

      {citizenScreen === 'notifications' && (
        <NotificationsScreen onBack={() => setCitizenScreen('home')} />
      )}
    </SafeAreaView>
  );
}

// ─── Admin notice screen ──────────────────────────────────────────────────────

function AdminNoticeScreen({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const { Pressable } = require('react-native') as typeof import('react-native');
  return (
    <View style={adminStyles.container}>
      <View style={adminStyles.card}>
        <Text style={adminStyles.icon}>🖥️</Text>
        <Text style={adminStyles.title}>Use the Web Dashboard</Text>
        <Text style={adminStyles.subtitle}>
          Hi {userName.split(' ')[0]}, your Admin / Officer account is best managed
          from the Civic Saathi web dashboard.
        </Text>
        <Text style={adminStyles.url}>localhost:5173</Text>
        <Pressable style={adminStyles.logoutBtn} onPress={onLogout}>
          <Text style={adminStyles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const adminStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    width: '100%', maxWidth: 360,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  url: { fontSize: 13, fontWeight: '600', color: '#0F766E', fontFamily: 'monospace', marginBottom: 20 },
  logoutBtn: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  splash: { flex: 1, backgroundColor: '#F4F6FA' },
  splashContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  splashLogo: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  splashEmoji: { fontSize: 40 },
  splashTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  splashSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 12 },
});
