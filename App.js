import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';

// Import fonts and splash screen
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Import navigator
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Start from './components/Start';
import Chat from './components/Chat';

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
				<Stack.Screen
					name="Start"
					component={Start}
				/>
				{/* Chat Screen */}
				<Stack.Screen
					name="Chat"
					component={Chat}
				/>
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
