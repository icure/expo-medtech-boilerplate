import React, { useCallback } from 'react';
import {ScrollView, StyleSheet, Image, View, Text, Linking, Button} from 'react-native';
import { useCreateOrUpdatePatientMutation } from '../services/patientApi';
import { Patient } from '@icure/medical-device-sdk';
import { v4 as uuidv4 } from 'uuid';


export const Home = () => {
  const openDoc = () => {
    Linking.openURL('https://docs.icure.com/sdks/how-to/index');
  };

  const [createOrUpdatePatient] = useCreateOrUpdatePatientMutation();

  const createRandomPatient = useCallback(async () => {
    const createdPatient = await createOrUpdatePatient(
      new Patient({
        id: uuidv4(),
        firstName: 'John',
        lastName: 'Doe',
      })
    );

    console.log(createdPatient);
  }, []);

  return (
    <ScrollView style={styles.homeScreen}>
      <View style={styles.contentHolder}>
        <Image style={styles.logo} source={require('../assets/images/logo.png')} />
        <Text style={styles.heading}>Well done !</Text>
        <Text style={styles.paraph}>If you arrived here, it means you completed your registration / login successfully.
        Time to head to <Text style={{ textDecorationLine: 'underline' }} onPress={openDoc}>iCure Documentation</Text> to add some data ! </Text>
      </View>
      <Button title="Create a random patient" onPress={createRandomPatient} />
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
