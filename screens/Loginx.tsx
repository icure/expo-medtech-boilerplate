import React, { useState } from "react"
import { View, TextInput, Button, Text, StyleSheet } from "react-native"
import * as Progress from "react-native-progress"
import {useNavigate} from 'react-router-native'
import {routes} from "../navigation/routes"
import Toast from "react-native-toast-message"
import {
  AuthenticationProcessTelecomType,
  CaptchaOptions,
  CardinalSdk,
  Challenge, randomUuid,
  resolveChallenge
} from "@icure/cardinal-sdk"
import {nitroKryptomCryptoService} from "@icure/nitro-kryptom"
import {AsyncStorageImpl} from "../utils/storage";
import AuthenticationWithProcessStep = CardinalSdk.AuthenticationWithProcessStep;
import {setupRelogin} from "../services/api";

const EmailLoginScreen = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [authStep, setAuthStep] = useState<AuthenticationWithProcessStep | undefined>(undefined)


  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)
  const isValidCode = (code: string) => /^\d{6}$/.test(code)

  const handleRequestCode = async () => {
    if (!isValidEmail(email)) return
    setLoading(true)
    try {
      setProgress(undefined)
      let challenge: Challenge
      try {
        const getChallengeResponse = await fetch(`https://msg-gw.icure.cloud/${process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID}/challenge`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        })
        challenge = JSON.parse(await getChallengeResponse.text())
      } catch (err: any) {
        if (err.message) console.error(err.message)
        Toast.show({ type: "error", visibilityTime: 1000, text1: "Failed to get challenge", text2: err.message ?? "Unexpected error" })
        throw err
      }
      setProgress(0)
      const challengeSolution = await resolveChallenge(
        challenge,
        process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!, 
        nitroKryptomCryptoService, 
        (x) => { setProgress(x) }
      )
      setProgress(undefined)
      try {
        const authenticationStep = await CardinalSdk.initializeWithProcess(
          undefined,
          "https://api.icure.cloud",
          "https://msg-gw.icure.cloud",
          process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!,
          process.env.EXPO_PUBLIC_EMAIL_AUTHENTICATION_PROCESS_ID!!,
          AuthenticationProcessTelecomType.Email,
          email,
          new CaptchaOptions.Kerberus.Computed({ solution: challengeSolution }),
          new AsyncStorageImpl(),
          {
            firstName: "unknown",
            lastName: "unknown"
          },
          {
            encryptedFields: {
              patient: ["notes", "addresses"]
            },
            cryptoService: nitroKryptomCryptoService
          }
        )
        setAuthStep(authenticationStep)
      } catch (err: any) {
        if (err.message) console.error(err.message)
        Toast.show({ type: "error", visibilityTime: 1000, text1: "Failed to get start authentication", text2: err.message ?? "Unexpected error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!isValidCode(code) || authStep == undefined) return
    setLoading(true)
    try {
      const sdk = await authStep.completeAuthentication(code)
      await setupRelogin(sdk) // TODO here
      navigate(routes.home)
    } catch (err: any) {
      if (err.message) console.error(err.message)
      Toast.show({ type: "error", visibilityTime: 1000, text1: err.message ?? "Login failed, wrong code?" })
      setLoading(false)
    }
  }

  const handleChangeEmail = () => {
    setAuthStep(undefined)
    setCode("")
    setProgress(undefined)
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, loading && styles.disabled]}
        placeholder="Email"
        value={email}
        editable={!loading && authStep == undefined}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {authStep != undefined && (
        <TextInput
          style={[styles.input, loading && styles.disabled]}
          placeholder="Code"
          value={code}
          editable={!loading}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="numeric"
          maxLength={6}
        />
      )}

      <Progress.Bar progress={progress} indeterminate={progress==undefined} width={null} style={{ opacity: loading ? 1 : 0 }} />

      {authStep == undefined && (
        <Button
          title="Request Code"
          onPress={handleRequestCode}
          disabled={!isValidEmail(email) || loading}
        />
      )}

      {authStep != undefined && (
        <>
          <Button
            title="Login"
            onPress={handleLogin}
            disabled={!isValidCode(code) || loading}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Change Email"
            onPress={handleChangeEmail}
            disabled={loading}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  disabled: {
    backgroundColor: "#f0f0f0",
  },
})

export default EmailLoginScreen
