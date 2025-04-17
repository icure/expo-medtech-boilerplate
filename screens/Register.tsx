import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet, ScrollView, Text} from 'react-native';
import {useForm, Controller} from 'react-hook-form';

import {RoundedInput, RoundedButton, TextHelper, ErrorMessage} from '../components/FormElements';
import {useNavigate} from 'react-router-native';
import { routes } from '../navigation/routes';

import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {completeAuthentication, setRegistrationInformation, setToken, startAuthentication} from '../services/api';
import {addProgressListener} from "@icure/expo-kerberus";


export const Register = (): JSX.Element => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      userFirstName: '',
      userLastName: '',
      userEmail: '',
      userCode: '',
    },
  });
  const [progress, setProgress] = useState<number>(0);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {online, kerberusProgress} = useAppSelector(state => ({
    ...state.cardinalApi,
  }));


  useEffect(() => {
    const subscription = addProgressListener(({ progress }) => {
      setProgress(progress);
    });

    return () => subscription.remove();
  }, [setProgress]);


  useEffect(() => {
    if (online) {
      navigate(routes.home);
    }
  }, [online, navigate]);
  
  const [isWaitingForCode, setWaitingForCode] = useState(false);

  const onAskCode = (data: {userEmail: string; userFirstName: string; userLastName: string}) => {
    setWaitingForCode(true);
    dispatch(setRegistrationInformation({
        email: data.userEmail,
        firstName: data.userFirstName,
        lastName: data.userLastName
    }));
    dispatch(startAuthentication());
  };

  const onRegister = (data: {userEmail: string; userFirstName: string; userLastName: string; userCode: string}) => {
    setWaitingForCode(false);
    dispatch(setToken({token: data.userCode}));
    dispatch(completeAuthentication());
  };

  return (
    <ScrollView style={styles.registerScreen}>
      <View style={styles.contentHolder}>
        <Image style={styles.logo} source={require('../assets/images/logo.png')} />
        <Text>{progress}</Text>
        <View style={styles.inputsContainer}>
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, onBlur, value}}) => <RoundedInput label="First name" onBlur={onBlur} onChange={onChange} value={value} isRequired />}
            name="userFirstName"
          />
          {errors.userFirstName && <ErrorMessage text="This field is required." />}
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, onBlur, value}}) => <RoundedInput label="Last name" onBlur={onBlur} onChange={onChange} value={value} isRequired />}
            name="userLastName"
          />
          {errors.userLastName && <ErrorMessage text="This field is required." />}
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, onBlur, value}}) => <RoundedInput label="Email or phone number" onBlur={onBlur} onChange={onChange} value={value} isRequired />}
            name="userEmail"
          />
          {errors.userEmail && <ErrorMessage text="This field is required." />}

          {isWaitingForCode ? (
            <>
              <Controller
                control={control}
                rules={{
                  required: true,
                }}
                render={({field: {onChange, onBlur, value}}) => <RoundedInput label="Code" onBlur={onBlur} onChange={onChange} value={value} isRequired />}
                name="userCode"
              />
              {errors.userCode && <ErrorMessage text="This field is required." />}
            </>
          ) : null}
        </View>

        {isWaitingForCode ? (
          <RoundedButton title="Register" onClick={handleSubmit(onRegister)} />
        ) : (
          <RoundedButton title="Receive a one time code" onClick={handleSubmit(onAskCode)} />
        )}

        <View style={styles.textHelperContainer}>
          <TextHelper text="Already have an account?" url="/" title="Log in" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  registerScreen: {
    flex: 1,
    height: '100%',
    paddingTop: 36,
    backgroundColor: '#FFFDFE',
  },
  contentHolder: {
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 201,
    height: 80,
    marginBottom: 60,
    resizeMode: 'contain',
  },
  inputsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  textHelperContainer: {
    marginTop: 24,
  },
  webviewContainer: {
    width: '100%',
    marginBottom: 24,
  },
});
