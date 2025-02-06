import React, { useState, useEffect } from 'react';
import { StyleSheet, LogBox } from 'react-native';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

// Import AsyncStorage for Firebase Auth persistence
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Import fonts and splash screen
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Import navigator
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Start from './components/Start';
import Chat from './components/Chat';

//AsyncStorage warning
LogBox.ignoreLogs(['AsyncStorage has been extracted from']);

// Firebase configuration
const firebaseConfig = {
	apiKey: 'REMOVED',
	authDomain: 'chatterbox-db-1750f.firebaseapp.com',
	projectId: 'chatterbox-db-1750f',
	storageBucket: 'chatterbox-db-1750f.firebasestorage.app',
	messagingSenderId: '825391937792',
	appId: 'REMOVED',
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use AsyncStorage for Firebase Auth persistence
const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Prevent the splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

// Create the navigator
const Stack = createNativeStackNavigator();

const App = () => {
	const [fontsLoaded, setFontsLoaded] = useState(false);

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
