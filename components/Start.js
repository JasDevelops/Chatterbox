import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ImageBackground,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
	Platform,
	Alert,
} from 'react-native';

import { signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import UserIcon from '../assets/icon.svg';
const backgroundImage = require('../assets/background-image.png');

const colors = ['#090C08', '#474056', '#8A95A5', '#B9C6AE'];

const Start = ({ navigation, auth }) => {
	// State to store user's name input
	const [name, setName] = useState('');
	// State to store selected background color
	const [selectedColor, setSelectedColor] = useState(colors[0]);
	//State to detect if keyboard is open
	const [keyboardVisible, setKeyboardVisible] = useState(false);

	useEffect(() => {
		// Add listeners to check, if keyboard is visible or not
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
			setKeyboardVisible(true);
		});
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardVisible(false);
		});

		// Load stored name from AsyncStorage
		const loadStoredName = async () => {
			try {
				const storedName = await AsyncStorage.getItem('userName');
				if (storedName) {
					setName(storedName);
				}
			} catch (error) {
				console.error('Error loading stored name:', error);
			}
		};

		loadStoredName();

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	// Handle anonymous login and navigate to Chat screen
	const handleSignIn = async () => {
		try {
			await AsyncStorage.setItem('userName', name);

			const userCredential = await signInAnonymously(auth);
			const user = userCredential.user;
			navigation.navigate('Chat', {
				userId: user.uid,
				name: name || 'Guest',
				selectedColor: selectedColor,
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to sign in. Please try again later.'); // Error message
			console.error('Login error:', error);
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View style={styles.container}>
				<ImageBackground
					source={backgroundImage}
					style={styles.background}
					resizeMode="cover">
					<View style={styles.titleContainer}>
						<Text
							style={styles.appTitle}
							accessibilityLabel="Chatterbox"
							accessibilityRole="header">
							Chatterbox
						</Text>
					</View>
					<View style={[styles.formContainer, keyboardVisible && styles.formContainerShifted]}>
						<View style={styles.inputContainer}>
							<UserIcon
								source={UserIcon}
								style={styles.icon}
								accessibilityLabel="User icon"
								accessibilityRole="image"
							/>
							<TextInput
								style={styles.textInput}
								value={name}
								onChangeText={setName}
								placeholder="Your Name"
								placeholderTextColor="rgba(117, 112, 131, 0.5)"
								accessibilityLabel="Name input field"
								accessibilityHint="Enter your name to personalize your chat experience."
								accessibilityRole="text"
							/>
						</View>
						<Text
							style={styles.colorText}
							accessibilityLabel="Choose Background Color"
							accessibilityRole="text">
							Choose Background Color:
						</Text>
						<View style={styles.colorContainer}>
							{colors.map((color) => (
								<TouchableOpacity
									key={color}
									style={[
										styles.colorCircle,
										{ backgroundColor: color },
										selectedColor === color && styles.selectedBorder,
									]}
									onPress={() => setSelectedColor(color)}
									accessibilityLabel={`Background color option ${color}`}
									accessibilityHint={`Tap to select this background color.`}
									accessibilityRole="button"
								/>
							))}
						</View>
						<TouchableOpacity
							style={styles.startButton}
							onPress={handleSignIn}
							accessibilityLabel="Start Chatting Button"
							accessibilityHint="Navigates to the chat screen with your selected options."
							accessibilityRole="button">
							<Text style={styles.buttonText}>Start Chatting</Text>
						</TouchableOpacity>
					</View>
				</ImageBackground>
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} />
			</View>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	background: {
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'space-evenly',
		alignItems: 'center',
	},

	titleContainer: {
		flex: 0.2,
		justifyContent: 'flex-start',
		alignItems: 'center',
		width: '100%',
	},
	appTitle: {
		fontSize: 45,
		fontWeight: 600,
		color: '#FFFFFF',
		fontFamily: 'Poppins-SemiBold',
	},
	formContainer: {
		flex: 0.44,
		width: '88%',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'space-evenly',
	},
	formContainerShifted: {
		flex: 0.6,
		paddingBottom: 5,
		paddingTop: 5,
		marginBottom: Platform.OS === 'android' ? 0 : 50,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '88%',
		height: 50,
		borderWidth: 1,
		borderColor: '#757083',
		paddingHorizontal: 10,
	},
	icon: {
		width: 24,
		height: 24,
		marginRight: 10,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins-Light',
		fontWeight: 300,
		color: 'rgba(117, 112, 131, 0.5)',
	},
	colorText: {
		fontSize: 16,
		fontFamily: 'Poppins-Light',
		fontWeight: 300,
		color: '#757083',
	},
	colorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	colorCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginHorizontal: 5,
	},
	selectedBorder: {
		borderWidth: 3,
		borderColor: '#757083',
	},
	startButton: {
		width: '88%',
		height: 50,
		backgroundColor: '#757083',
		justifyContent: 'center',
		alignItems: 'center',
	},

	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins-Light',
		fontWeight: 600,
		color: '#FFFFFF',
	},
});

export default Start;
