import React, {useCallback, useEffect} from 'react';
import {Image, Linking, ScrollView, StyleSheet, Text, View, TouchableOpacity, Pressable, ActivityIndicator} from 'react-native';
import {useCreateOrUpdatePatientMutation, useLazyFilterPatientsQuery} from '../services/patientApi';
import {Annotation, DecryptedPatient} from "@icure/cardinal-sdk";
import {debugStorage} from '../utils/debugStorage';
import {store} from '../redux/store';
import {logout} from '../services/api';
import {useAppDispatch} from '../redux/hooks';
import {useNavigate} from 'react-router-native';
import {routes} from '../navigation/routes';

export const Home = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const [isLoggingOut, setIsLoggingOut] = React.useState(false);
	const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

	const openDoc = () => {
		Linking.openURL('https://docs.icure.com/sdks/how-to/index');
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await dispatch(logout()).unwrap();
			navigate(routes.login, { replace: true });
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const [createOrUpdatePatient] = useCreateOrUpdatePatientMutation();
	const [filterPatients, {data}] = useLazyFilterPatientsQuery();

	useEffect(() => {
		if (data) {
			console.log(JSON.stringify(data))
		}
	}, [data]);

	const createRandomPatient = useCallback(async () => {
		setLoadingAction('create-1');
		try {
			const createdPatient = await createOrUpdatePatient(
				new DecryptedPatient({
					firstName: 'John',
					lastName: 'Doe',
				})
			);
			console.log(createdPatient);
		} finally {
			setLoadingAction(null);
		}
	}, [createOrUpdatePatient]);

	const createXPatients = useCallback(async (numberOfPatient: number) => {
		return Array.from({length: numberOfPatient}).map(async () => {
			return createOrUpdatePatient(
				new DecryptedPatient({
					firstName: 'John',
					lastName: 'Doe',
					notes: [
						new Annotation({
							markdown: {
								'fr': "Ceci est une note",
							}
						})
					]
				})
			);
		});
	}, [createOrUpdatePatient]);

	const handleCreate2Patients = async () => {
		setLoadingAction('create-2');
		try {
			const patients = await Promise.all(await createXPatients(2));
			console.log(JSON.stringify(patients));
		} finally {
			setLoadingAction(null);
		}
	};

	const handleCreate100Patients = async () => {
		setLoadingAction('create-100');
		try {
			const patients = await Promise.all(await createXPatients(100));
			console.log(JSON.stringify(patients));
		} finally {
			setLoadingAction(null);
		}
	};

	const handleGetAllPatients = async () => {
		setLoadingAction('get-all');
		try {
			await filterPatients();
		} finally {
			setLoadingAction(null);
		}
	};

	return (
		<ScrollView style={styles.homeScreen} contentContainerStyle={styles.scrollContent}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={handleLogout}
					style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
					disabled={isLoggingOut}
				>
					{isLoggingOut ? (
						<>
							<ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
							<Text style={styles.logoutText}>Logging out...</Text>
						</>
					) : (
						<Text style={styles.logoutText}>Logout</Text>
					)}
				</TouchableOpacity>
			</View>

			{/* Welcome Section */}
			<View style={styles.contentHolder}>
				<Image style={styles.logo} source={require('../assets/images/logo.png')}/>
				<Text style={styles.heading}>Well done! 🎉</Text>
				<Text style={styles.paraph}>
					You've successfully logged in. Time to explore the{' '}
					<Text style={styles.link} onPress={openDoc}>iCure Documentation</Text>
					{' '}and start adding data!
				</Text>
			</View>

			{/* Patient Actions Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Patient Management</Text>

				<CustomButton
					title="Create a Random Patient"
					onPress={createRandomPatient}
					icon="👤"
					loading={loadingAction === 'create-1'}
				/>

				<CustomButton
					title="Create 2 Patients"
					onPress={handleCreate2Patients}
					icon="👥"
					loading={loadingAction === 'create-2'}
				/>

				<CustomButton
					title="Create 100 Patients"
					onPress={handleCreate100Patients}
					icon="🏥"
					variant="secondary"
					loading={loadingAction === 'create-100'}
				/>

				<CustomButton
					title="Get All Patients"
					onPress={handleGetAllPatients}
					icon="📋"
					variant="secondary"
					loading={loadingAction === 'get-all'}
				/>
			</View>

			{/* Debug Tools Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>🔍 Debug Tools</Text>

				<CustomButton
					title="Check Redux State"
					onPress={() => {
						const state = store.getState();
						console.log('📊 Current Redux State:', JSON.stringify(state.cardinalApi, null, 2));
					}}
					variant="outline"
					small
				/>

				<CustomButton
					title="Check MMKV Storage"
					onPress={() => {
						debugStorage.getAllData();
					}}
					variant="outline"
					small
				/>

				<CustomButton
					title="Check Persisted State"
					onPress={() => {
						debugStorage.getPersistedState();
					}}
					variant="outline"
					small
				/>
			</View>
		</ScrollView>
	);
};

// Custom Button Component
const CustomButton = ({ title, onPress, icon, variant = 'primary', small = false, loading = false }: {
	title: string;
	onPress: () => void;
	icon?: string;
	variant?: 'primary' | 'secondary' | 'outline';
	small?: boolean;
	loading?: boolean;
}) => {
	const buttonStyle = [
		styles.customButton,
		variant === 'secondary' && styles.customButtonSecondary,
		variant === 'outline' && styles.customButtonOutline,
		small && styles.customButtonSmall,
		loading && styles.customButtonLoading,
	];

	const textStyle = [
		styles.customButtonText,
		variant === 'secondary' && styles.customButtonTextSecondary,
		variant === 'outline' && styles.customButtonTextOutline,
		small && styles.customButtonTextSmall,
	];

	const spinnerColor = variant === 'outline' ? '#40908e' : '#FFFFFF';

	return (
		<Pressable
			style={({ pressed }) => [
				...buttonStyle,
				pressed && !loading && styles.customButtonPressed
			]}
			onPress={onPress}
			disabled={loading}
		>
			{loading ? (
				<>
					<ActivityIndicator size="small" color={spinnerColor} style={{ marginRight: 8 }} />
					<Text style={textStyle}>Processing...</Text>
				</>
			) : (
				<>
					{icon && <Text style={styles.buttonIcon}>{icon}</Text>}
					<Text style={textStyle}>{title}</Text>
				</>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	homeScreen: {
		flex: 1,
		backgroundColor: '#F8F9FA',
	},
	scrollContent: {
		paddingBottom: 40,
	},
	header: {
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 10,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	logoutButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: '#FF3B30',
		flexDirection: 'row',
		alignItems: 'center',
	},
	logoutButtonDisabled: {
		opacity: 0.6,
	},
	logoutText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
	},
	contentHolder: {
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 30,
		backgroundColor: '#FFFFFF',
		marginHorizontal: 16,
		marginTop: 10,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	logo: {
		width: 180,
		height: 60,
		resizeMode: 'contain',
		marginBottom: 20,
	},
	heading: {
		fontSize: 28,
		fontWeight: '700',
		color: '#40908e',
		textAlign: 'center',
		marginBottom: 12,
	},
	paraph: {
		fontSize: 15,
		color: '#666',
		textAlign: 'center',
		lineHeight: 22,
	},
	link: {
		color: '#40908e',
		textDecorationLine: 'underline',
		fontWeight: '600',
	},
	section: {
		marginTop: 24,
		marginHorizontal: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#333',
		marginBottom: 16,
	},
	customButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#40908e',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: '#40908e',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	customButtonSecondary: {
		backgroundColor: '#5AB9F7',
		shadowColor: '#5AB9F7',
	},
	customButtonOutline: {
		backgroundColor: 'transparent',
		borderWidth: 1.5,
		borderColor: '#40908e',
		shadowOpacity: 0,
		elevation: 0,
	},
	customButtonSmall: {
		paddingVertical: 10,
		marginBottom: 8,
	},
	customButtonLoading: {
		opacity: 0.7,
	},
	customButtonPressed: {
		opacity: 0.7,
		transform: [{ scale: 0.98 }],
	},
	customButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	customButtonTextSecondary: {
		color: '#FFFFFF',
	},
	customButtonTextOutline: {
		color: '#40908e',
	},
	customButtonTextSmall: {
		fontSize: 14,
	},
	buttonIcon: {
		fontSize: 20,
		marginRight: 8,
	},
});
