import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Platform,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
	Text,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';

const Chat = ({ route, navigation }) => {
	// Get user name & background color
	const { name, selectedColor } = route.params;
	// State to manage chat messages
	const [messages, setMessages] = useState([]);
	// Function to handle sending new messages
	const onSend = (newMessages) => {
		setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
	};

	useEffect(() => {
		// Initialize chat with default message
		setMessages([
			// System message displayed when user enters the chat
			{
				_id: 0,
				text: 'You have entered the chat.',
				createdAt: new Date(),
				system: true, // Marks it as a system message
			},
			// Default bot message
			{
				_id: 1,
				text: 'Hello developer',
				createdAt: new Date(),
				user: {
					_id: 2,
					name: 'React Native',
					avatar: 'https://avatar.iran.liara.run/public/89', // Placeholder Bot Avatar from "https://avatar-placeholder.iran.liara.run/avatars"
				},
			},
		]);
	}, []);
	useEffect(() => {
		// Set the navigation title to the user's name
		navigation.setOptions({ title: name || 'Chat' });
	}, [name, navigation]); //  Ensures the effect runs when `name` changes

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			{/* Main container with Dynamically set background color */}
			<View style={[styles.container, { backgroundColor: selectedColor }]}>
				{/* Chat interface component */}
				<GiftedChat
					messages={messages}
					onSend={(messages) => onSend(messages)}
					user={{
						_id: 1,
						name: name || 'You',
						avatar: 'https://avatar.iran.liara.run/public/66', // User Avatar from "https://avatar-placeholder.iran.liara.run/avatars"
					}}
					// Chat bubbles
					renderBubble={(props) => (
						<Bubble
							{...props}
							wrapperStyle={{
								right: { backgroundColor: '#757083' }, // User bubble color
								left: { backgroundColor: '#f0f0f0' }, // Received bubble color
							}}
							accessibilityLabel="Chat bubble"
							accessibilityHint="Contains the chat message content."
							accessibilityRole="text"
						/>
					)}
					// Date label above bubbles
					renderDay={(props) => (
						<Day
							{...props}
							textStyle={{ color: '#f0f0f0' }}
							accessibilityLabel={`Chat messages from ${new Date(props.currentMessage.createdAt).toDateString()}`}
							accessibilityHint="Indicates the date of the following messages."
							accessibilityRole="text"
						/>
					)}
					// System message ("You have entered the chat.")
					renderSystemMessage={(props) => (
						<View style={{ alignItems: 'center', marginVertical: 10 }}>
							<Text
								style={{ color: '#f0f0f0' }}
								accessibilityLabel="System message"
								accessibilityHint="Provides system-related information about the chat session."
								accessibilityRole="text">
								{props.currentMessage.text}{' '}
							</Text>
						</View>
					)}
					// Input bar container
					renderInputToolbar={(props) => (
						<InputToolbar
							{...props}
							containerStyle={styles.inputToolbar} // Ensures enough height for Composer
							accessibilityLabel="Message input field"
							accessibilityHint="Type a message and send it using the send button."
							accessibilityRole="text"
						/>
					)}
					renderComposer={(props) => (
						<Composer
							{...props}
							textInputStyle={styles.composerInput} // Forces Input field to be visible
							accessibilityLabel="Type a message"
							accessibilityHint="Enter your chat message here."
							accessibilityRole="text"
						/>
					)}
					renderSend={(props) => (
						<Send
							{...props}
							containerStyle={styles.sendButtonContainer}
							accessibilityLabel="Send button"
							accessibilityHint="Tap to send your message."
							accessibilityRole="button">
							<View>
								<Ionicons
									name="send"
									size={24}
									color="#757083"
								/>
							</View>
						</Send>
					)}
					alwaysShowSend={true} // Keeps the send button visible
					keyboardShouldPersistTaps="handled" // Prevents chat from interfering with input field
				/>
				{/* Prevent layout shifts when keyboard is visible */}
				{Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
			</View>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	// Full-screen container with dynamic background color
	container: {
		flex: 1, // Ensures it takes full screen height
	},
	inputToolbar: {
		width: '100%',
		alignSelf: 'center',
		minHeight: 50, // Ensures enough height for the input field
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#ddd',
	},
	composerInput: {
		color: '#000',
		fontSize: 16,
		paddingVertical: 10, // Increases height of the input field
		backgroundColor: '#fff',
		borderRadius: 20,
		paddingHorizontal: 10,
		minHeight: 40, // Forces input field to always be visible
		flex: 1,
	},
	sendButtonContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 5,
		paddingRight: 5,
	},
});

export default Chat;
