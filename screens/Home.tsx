import React, {useCallback, useEffect} from 'react';
import {Button, Image, Linking, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useCreateOrUpdatePatientMutation, useLazyFilterPatientsQuery} from '../services/patientApi';
import {Annotation, DecryptedPatient} from "@icure/cardinal-sdk";
import {StrongRandom} from "@icure/expo-kryptom";


export const Home = () => {
	const openDoc = () => {
		Linking.openURL('https://docs.icure.com/sdks/how-to/index');
	};

	const [createOrUpdatePatient] = useCreateOrUpdatePatientMutation();
	const [filterPatients, {data}] = useLazyFilterPatientsQuery();

	useEffect(() => {
		if (data) {
			console.log(JSON.stringify(data))
		}
	}, [data]);

	const createRandomPatient = useCallback(async () => {
		const createdPatient = await createOrUpdatePatient(
			new DecryptedPatient({
				id: StrongRandom.randomUUID(),
				firstName: 'John',
				lastName: 'Doe',
			})
		);

		console.log(createdPatient);
	}, []);

	const createXPatients = useCallback(async (numberOfPatient: number) => {
		return Array.from({length: numberOfPatient}).map(async () => {
			return createOrUpdatePatient(
				new DecryptedPatient({
					id: StrongRandom.randomUUID(),
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
	}, []);

	return (
		<ScrollView style={styles.homeScreen}>
			<View style={styles.contentHolder}>
				<Image style={styles.logo} source={require('../assets/images/logo.png')}/>
				<Text style={styles.heading}>Well done !</Text>
				<Text style={styles.paraph}>If you arrived here, it means you completed your registration / login
					successfully.
					Time to head to <Text style={{textDecorationLine: 'underline'}} onPress={openDoc}>iCure
						Documentation</Text> to add some data ! </Text>
			</View>
			<Button title="Create a random patient" onPress={createRandomPatient}/>
			<Button title="Create 2 random patient" onPress={async () => {
				const patients = await Promise.all(await createXPatients(2));
				console.log(JSON.stringify(patients))
			}}/>
			<Button title="Create 100 random patient" onPress={async () => {
				const patients = await Promise.all(await createXPatients(100));
				console.log(JSON.stringify(patients))
			}}/>
			<Button title="Get all patients" onPress={async () => {
				await filterPatients()
			}}/>


		</ScrollView>
	);
};

const styles = StyleSheet.create({
	homeScreen: {
		flex: 1,
		height: '100%',
		paddingTop: 40,
		backgroundColor: '#FFFDFE',
	},
	heading: {
		fontSize: 24,
		color: '#40908e',
		textAlign: 'center',
		marginBottom: 10,
	},
	paraph: {
		fontSize: 14,
		color: '#000000',
		textAlign: 'center',
		marginBottom: 32,
		marginTop: 10,
	},
	contentHolder: {
		alignItems: 'center',
		padding: 24,
	},
	logo: {
		width: 201,
		resizeMode: 'contain',
	},
});
