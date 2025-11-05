import React, { useState } from "react"
import { View, TextInput, Text, StyleSheet, Pressable, Image, KeyboardAvoidingView, Platform } from "react-native"
import * as Progress from "react-native-progress"
import {useNavigate} from 'react-router-native'
import {routes} from "../navigation/routes"
import Toast from "react-native-toast-message"
import {
  AuthenticationProcessTelecomType,
  CaptchaOptions,
  CardinalSdk,
  Challenge,
  resolveChallenge
} from "@icure/cardinal-sdk"
import {nitroKryptomCryptoService} from "@icure/nitro-kryptom"
import {MmkvStorageFacade} from "../utils/storage";
import AuthenticationWithProcessStep = CardinalSdk.AuthenticationWithProcessStep;
import {setupRelogin} from "../services/api";
import {useAppDispatch} from "../redux/hooks";

const EmailLoginScreen = () => {
  const dispatch = useAppDispatch()
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
          new MmkvStorageFacade(),
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
        Toast.show({ type: "error", visibilityTime: 1000, text1: "Failed to start authentication", text2: err.message ?? "Unexpected error" })
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
      await dispatch(setupRelogin(sdk)).unwrap()
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../assets/images/logo.png')}
          />
          <Text style={styles.title}>
            {authStep ? "Enter Verification Code" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle}>
            {authStep
              ? `We sent a code to ${email}`
              : "Sign in to continue to your account"
            }
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.formContainer}>
          {authStep == undefined ? (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={email}
                editable={!loading}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput, loading && styles.inputDisabled]}
                placeholder="000000"
                placeholderTextColor="#999"
                value={code}
                editable={!loading}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </>
          )}

          {/* Progress Bar */}
          {loading && (
            <View style={styles.progressContainer}>
              <Progress.Bar
                progress={progress}
                indeterminate={progress === undefined}
                width={null}
                color="#40908e"
                unfilledColor="#E0E0E0"
                borderWidth={0}
                height={4}
                borderRadius={2}
              />
            </View>
          )}

          {/* Buttons */}
          {authStep == undefined ? (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (!isValidEmail(email) || loading) && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
              onPress={handleRequestCode}
              disabled={!isValidEmail(email) || loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Sending..." : "Request Code"}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!isValidCode(code) || loading) && styles.buttonDisabled,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleLogin}
                disabled={!isValidCode(code) || loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Verifying..." : "Login"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  loading && styles.buttonDisabled,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleChangeEmail}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Change Email</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 160,
    height: 60,
    resizeMode: "contain",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 8,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  progressContainer: {
    marginBottom: 20,
    marginTop: -10,
  },
  primaryButton: {
    backgroundColor: "#40908e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#40908e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#40908e",
  },
  secondaryButtonText: {
    color: "#40908e",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    paddingTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})

export default EmailLoginScreen
