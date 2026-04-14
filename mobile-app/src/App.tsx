import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@store/index';

export default function App() {
	const hydrateUser = useAuthStore(state => state.hydrateUser);
	const isLoading = useAuthStore(state => state.isLoading);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const user = useAuthStore(state => state.user);

	useEffect(() => {
		hydrateUser().catch(() => {
			// Hydration failure should not block app bootstrap.
		});
	}, [hydrateUser]);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<View style={styles.content}>
				<Text style={styles.title}>Civic Saathi</Text>
				<Text style={styles.subtitle}>Citizen issue reporting platform</Text>

				{isLoading ? (
					<ActivityIndicator size="large" color="#0F766E" />
				) : isAuthenticated ? (
					<Text style={styles.statusText}>Welcome back{user ? `, ${user.name}` : ''}.</Text>
				) : (
					<Text style={styles.statusText}>Authentication screens will be mounted here next.</Text>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F4F6FA'
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 16,
		color: '#334155',
		marginBottom: 24
	},
	statusText: {
		textAlign: 'center',
		color: '#1E293B'
	}
});
