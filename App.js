import React, { useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, LogBox, Alert } from 'react-native';

// Import fonts and splash screen
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Import navigator
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Firebase imports
import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables
import {
	API_KEY,
	AUTH_DOMAIN,
	PROJECT_ID,
	STORAGE_BUCKET,
	MESSAGING_SENDER_ID,
	APP_ID,
} from '@env';

// Import components
import Start from './components/Start';
import Chat from './components/Chat';

//AsyncStorage warning
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
if (getApps().length === 0) {
	app = initializeApp(firebaseConfig);
} else {
	app = getApp();
}
// Initalize Firestore
const db = getFirestore(app);

// Initalize Firebase Auth
let auth;
try {
	auth = initializeAuth(app, {
		persistence: getReactNativePersistence(ReactNativeAsyncStorage),
	});
} catch (error) {
	auth = getAuth(app); // Fallback in case of error
}

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
			await SplashScreen.hideAsync(); // Hide splash screen after fonts are loaded
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
						Alert.alert('Connection Lost!');
						await disableNetwork(db); //  Ensure Firestore is properly disabled
						console.log('Firestore network disabled');
					} else {
						await enableNetwork(db); // Ensure Firestore is properly enabled
						console.log('Firestore network enabled');
					}
				} catch (error) {
					console.error('Error managing Firestore network:', error);
				}
			};

			updateFirestoreConnection(); // Call async function
		}
	}, [netInfo.isConnected]);

	// After all hooks have been called, conditionally render UI
	if (!fontsLoaded) {
		return null; // Keeps splash screen until fonts are loaded
	}

	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Start">
				{/* Start Screen */}
				<Stack.Screen name="Start">
					{(props) => (
						<Start
							db={db}
							auth={auth}
							{...props}
						/>
					)}
				</Stack.Screen>
				{/* Chat Screen */}
				<Stack.Screen name="Chat">
					{(props) => (
						<Chat
							db={db}
							auth={auth}
							isConnected={isConnected}
							{...props}
						/>
					)}
				</Stack.Screen>
			</Stack.Navigator>
		</NavigationContainer>
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
