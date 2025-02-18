import React, { useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, LogBox, Alert } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, disableNetwork, enableNetwork } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
	API_KEY,
	AUTH_DOMAIN,
	PROJECT_ID,
	STORAGE_BUCKET,
	MESSAGING_SENDER_ID,
	APP_ID,
} from '@env';

import Start from './components/Start';
import Chat from './components/Chat';

LogBox.ignoreLogs(['AsyncStorage has been extracted from']);

// Firebase configuration
const firebaseConfig = {
	apiKey: API_KEY,
	authDomain: AUTH_DOMAIN,
	projectId: PROJECT_ID,
	storageBucket: STORAGE_BUCKET,
	messagingSenderId: MESSAGING_SENDER_ID,
	appId: APP_ID,
};

// Initialize the Firebase app once only
let app;
if (!getApps().length) {
	// Firebase hasn't been initialized, proceed with initialization
	app = initializeApp(firebaseConfig);
} else {
	// Firebase has already been initialized, use the existing app instance
	app = getApp();
}

// Initialize Firestore
const db = getFirestore(app);

// Ensure Firebase Auth uses AsyncStorage for persistence
const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firebase Storage
const storage = getStorage(app);

// Prevent the splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

// Create the navigator
const Stack = createNativeStackNavigator();

const App = () => {
	const netInfo = useNetInfo();
	const [fontsLoaded, setFontsLoaded] = useState(false);
	const [isConnected, setIsConnected] = useState(netInfo.isConnected ?? false);

	// Load custom fonts
	useEffect(() => {
		const loadFonts = async () => {
			await Font.loadAsync({
				'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
				'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
			});
			setFontsLoaded(true);
			await SplashScreen.hideAsync();
		};

		loadFonts();
	}, []);

	// Monitor network status and enable/disable Firestore accordingly
	useEffect(() => {
		if (netInfo.isConnected !== null && netInfo.isConnected !== isConnected) {
			setIsConnected(netInfo.isConnected);

			const updateFirestoreConnection = async () => {
				try {
					if (netInfo.isConnected === false) {
						Alert.alert('You are offline. You can read, but cannot send messages.');
						await disableNetwork(db);
						('Firestore network disabled');
					} else {
						await enableNetwork(db);
						('Firestore network enabled');
					}
				} catch (error) {
					console.error('Error managing Firestore network:', error);
				}
			};

			updateFirestoreConnection();
		}
	}, [netInfo.isConnected]);

	// After all hooks have been called, conditionally render UI
	if (!fontsLoaded) {
		return null;
	}

	return (
		<ActionSheetProvider>
			<NavigationContainer>
				<Stack.Navigator initialRouteName="Start">
					<Stack.Screen name="Start">
						{(props) => (
							<Start
								db={db}
								auth={auth}
								{...props}
							/>
						)}
					</Stack.Screen>
					<Stack.Screen name="Chat">
						{(props) => (
							<Chat
								db={db}
								auth={auth}
								storage={storage}
								isConnected={isConnected}
								{...props}
							/>
						)}
					</Stack.Screen>
				</Stack.Navigator>
			</NavigationContainer>
		</ActionSheetProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default App;
