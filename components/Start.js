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
} from 'react-native';

// Import assets
import UserIcon from '../assets/icon.svg';
const backgroundImage = require('../assets/background-image.png');

// Define background color options
const colors = ['#090C08', '#474056', '#8A95A5', '#B9C6AE'];

const Start = ({ navigation }) => {
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

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View style={styles.container}>
				<ImageBackground
					source={backgroundImage}
					style={styles.background}
					resizeMode="cover">
					{/* App Title */}
					<View style={styles.titleContainer}>
						<Text
							style={styles.appTitle}
							accessibilityLabel="Chatterbox"
							accessibilityRole="header">
							Chatterbox
						</Text>
					</View>

					{/* Bottom Container (Moved Up Slightly if Keyboard is Open)*/}
					<View style={[styles.formContainer, keyboardVisible && styles.formContainerShifted]}>
						{/* Input Field with Icon */}
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

						{/* Background Color Selection */}
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

						{/* Start Chatting Button */}
						<TouchableOpacity
							style={styles.startButton}
							onPress={() => navigation.navigate('Chat', { name, selectedColor })}
							accessibilityLabel="Start Chatting Button"
							accessibilityHint="Navigates to the chat screen with your selected options."
							accessibilityRole="button">
							<Text style={styles.buttonText}>Start Chatting</Text>
						</TouchableOpacity>
					</View>
				</ImageBackground>
				{/* Keyboard hiding input */}
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
		// Background image covers entire screen
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'space-evenly',
		alignItems: 'center',
	},

	// App title container
	titleContainer: {
		flex: 0.2, // Allocates 20% of screen height
		justifyContent: 'flex-start',
		alignItems: 'center',
		width: '100%',
	},
	// App title text
	appTitle: {
		fontSize: 45,
		fontWeight: 600,
		color: '#FFFFFF',
		fontFamily: 'Poppins-SemiBold',
	},
	// Main container for input, color selection, and button
	formContainer: {
		flex: 0.44, // Allocates 44% of screen height
		width: '88%',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'space-evenly', // Distributes input, colors, and button evenly
	},
	// Moves the form up when the keyboard is open
	formContainerShifted: {
		flex: 0.6, // Allocates 55% of screen height
		paddingBottom: Platform.OS === 'android' ? 50 : 5, // Adds padding at the bottom
		paddingTop: Platform.OS === 'android' ? 50 : 5, // Adds padding at the bottom
		marginBottom: 50,
	},
	// Input field and icon container
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '88%',
		height: 50,
		borderWidth: 1,
		borderColor: '#757083',
		paddingHorizontal: 10,
	},
	// User icon
	icon: {
		width: 24,
		height: 24,
		marginRight: 10,
	},
	// "Your Name" input field
	textInput: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins-Light',
		fontWeight: 300,
		color: 'rgba(117, 112, 131, 0.5)',
	},
	// "Choose Background Color" label
	colorText: {
		fontSize: 16,
		fontFamily: 'Poppins-Light',
		fontWeight: 300,
		color: '#757083',
	},
	// Color selection container
	colorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	// Individual color circles
	colorCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginHorizontal: 5,
	},
	// Selected border highlight
	selectedBorder: {
		borderWidth: 3,
		borderColor: '#757083',
	},
	// "Start Chatting" button
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
