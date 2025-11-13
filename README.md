<div style="text-align: center;">
    <a href="https://docs.icure.com">
        <img alt="icure-your-data-platform-for-medtech-and-ehr" src="https://icure.com/assets/icons/logo.svg">
    </a>
    <h1>CardinalSDK React Native Template</h1>
</div>

Start working on your e-health React Native app with CardinalSDK in a few minutes, by using our dedicated expo template.

## Setup a project using this template

Using gh cli

```bash
gh repo create MyMedTechApp --template icure/expo-medtech-boilerplate --private
git clone https://github.com/<me>/MyMedTechApp
```

or using GitHub web interface

## Requirements

This template requires that your environment is properly setup for react native development.
We recommend you follow the official [react native](https://reactnative.dev/docs/0.79/environment-setup) or [expo](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local) guides.

The CardinalSDK on react-native uses native apis through [nitro modules](https://nitro.margelo.com/) for encryption. 
As expo go doesn't support custom native modules you will have to use a development build to try out your app.

> [!IMPORTANT]
> When trying out your in development mode ensure your emulator has at least 6GB of RAM to accommodate increased memory
> usage while running in development mode with Expo and React Native tooling.
> This extended RAM usage is not reflected in release builds of the application.

## Initial setup

Before starting the app for the first time you will need to perform some setup steps 

### 1 – Install the dependencies and prebuild

```bash
yarn install
yarn expo prebuild
``` 

### 2 – Configure the android SDK for your environment

Create a new file `android/local.properties` and add the location to your android SDK, for example:

```properties
sdk.dir=/Users/jdoe/Library/Android/sdk
```

### 3 – Connect the application to your cardinal environment

If you haven't already setup an environment for your cardinal application, use our [cockpit](https://cockpit.icure.com/)
to create and setup your environment.

The [onboarding process](https://docs.icure.com/cockpit/how-to/how-to-start) will guide you through the step needed to
start using cardinal on react-native or other environments.

Make sure to take note of the `EXTERNAL_SERVICES_SPEC_ID` and `EMAIL_AUTHENTICATION_PROCESS_ID` obtained during this
process.

If you already have an environment setup, you can find back your spec id and process id using [this guide](https://docs.icure.com/cockpit/how-to/how-to-start/index.html#configuration-details-shortcuts).

Create a `.env` file and fill the spec and process id from the cockpit, for example:

```properties
EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID=ic-jdoe-ee4ef7d8-df00-4e44-aa99-ce830525360d
EXPO_PUBLIC_EMAIL_AUTHENTICATION_PROCESS_ID=801c00ee-519b-4da5-8950-55d9d1f4c0b2
```

### 4 – Ready to start!

You are now ready to start developing your application. 

You can already try out the boilerplate which includes a basic authentication flow and some sample code for the creation
or retrieval of patients.

Run your application on a android device/emulator using

```bash
yarn run android
```

or run on an ios device/emulator using

```bash
yarn run ios
```

## What's included

This boilerplate includes the minimal setup for starting to work with CardinalSDK on react native. 

This section details the modules included in this boilerplate and their purposes.

You don't need to read this section to start using the boilerplate, but it will allow you to better understand how the
CardinalSDK works on react-native and may help you in case you encounter issues during development.

### Nitro-kryptom cryptographic primitives service

The data on cardinal is end-to-end encrypted. 
To do this, the CardinalSDK needs access to cryptographic primitives, such as RSA and AES among others.

On browsers and node the CardinalSDK can use [`crypto.subtle`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle), 
however, this is not available on react-native.

The [nitro-kryptom module](https://github.com/icure/nitro-kryptom) provides the SDK with access to the cryptographic 
primitives on react-native.

Note that on react-native you must provide the cryptographic service explicitly to the SDK during initialization, for
example:

```typescript
import {nitroKryptomCryptoService} from '@icure/nitro-kryptom'

await CardinalSdk.initialize(
  undefined,
  "https://api.icure.cloud",
  new AuthenticationMethod.UsingCredentials.UsernameLongToken(`${user.groupId}/${user.id}`, token),
  new MmkvStorageFacade(),
  {
    cryptoService: nitroKryptomCryptoService // if not on web this is mandatory or you will get runtime errors!
  }
)
```

### Fetch polyfill

This boilerplate includes a polyfill for `fetch`, which should be added before using the CardinalSDK.
In this boilerplate the polyfill is defined under `polyfills/FetchPolyfill.ts` and it is added as the first thing in 
`index.ts`.

If the polyfill is not setup correctly, you will get obscure errors at runtime such as

```
JsonConvertException: Illegal input: Expected start of the object '{', but had 'EOF' instead at path: $
JSON input:
```

### Storage facade

The CardinalSDK needs to store the user's personal encryption keys among other data. 
To do this, the SDK needs a `StorageFacade` which specifies how this data can be stored.

This boilerplate comes with an implementation of `StorageFacade` which uses a [react-native wrapper](https://github.com/mrousavy/react-native-mmkv) of [MMKV](https://github.com/Tencent/MMKV).

Note that this implementation stores the data in plaintext.
Since the SDK has to store sensitive data like the encryption keys of the user, we recommend that in production you use
a more secure storage facade, for example by [encrypting the mmkv storage](https://github.com/mrousavy/react-native-mmkv?tab=readme-ov-file#customize)
or by using another solution based on keychain/keystore (on ios/android respectively) such as [react-native-keychain](https://github.com/oblador/react-native-keychain).

### Captcha

This boilerplate lets user register or login using an authentication processes, which send an authentication code by 
email or SMS.

These processes require that the client solves a captcha before starting the authentication process.

This boilerplate is using iCure's [kerberus](https://github.com/icure/Kerberus) as a captcha solution.
This is a proof-of-work captcha solution developed by iCure for usage on multiple platforms.

Note that when using kerberus on react-native you should pass the nitro-kryptom cryptographic service:

```typescript
await resolveChallenge(
  challenge,
  process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!,
  nitroKryptomCryptoService,
  (x) => { setProgress(x) }
)
```

Unlike in the initialization of the SDK it is not mandatory to provide the cryptographic service to the resolveChallenge 
method; however, it is strongly recommended as it will allow for faster computation of the captcha.

As an alternative to kerberus you can use [friendly captcha](https://friendlycaptcha.com/) or [google recaptcha](https://developers.google.com/recaptcha),
however, you will first need to enable the service and configure your api key through the cockpit.

### (optional) Redux

This boilerplate uses Redux to manage the state of the app and persist it. 

This component is not required for using CardinalSDK but it can help to implement features such as caching or automatic re-login on startup (see `./components/auth/AuthGuard.tsx`).

The boilerplate also shows how to convert the CardinalSDK models to/from JSON which allows for proper serialization of the state in redux.

Note: this boilerplate stores the authentication token of the user in the redux state. 
In production, you may want to protect this, for example,
by encrypting it using a keychain/keystore solution as detailed in the [storage facade](#storage-facade) section.

## What's next? 

Check out our [MedTech Documentation](https://docs.icure.com/sdks/quick-start/react-native-quick-start) and particularly our [How To's](https://docs.icure.com/sdks/how-to/index), to start implementing new functionalities inside your React Native App! 

## Troubleshooting

### App crashes at startup

If the app crashes at startup during development, it might because the device or emulator you're using doesn't have 
enough RAM to support the debug environment.

To solve this issue either use a device/emulator with more RAM, or try your application using a release build.
