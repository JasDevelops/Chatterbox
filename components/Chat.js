import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableWithoutFeedback, Keyboard, Text } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Chat = ({ route, navigation, db }) => {
	// Get safe are inset
	const insets = useSafeAreaInsets();
	// Use state for userId
	const [userId, setUserId] = useState(null);
	// Get user ID, name & background color
	const { name, selectedColor } = route.params;
	// State to manage chat messages
	const [messages, setMessages] = useState([]);
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

	// Function to handle sending new messages
	const onSend = (newMessages = []) => {
		if (!userId) return; // Ensure userId is available before sending messages

		const message = newMessages[0]; // Get the latest message

		// Save new message to Firestore
		addDoc(collection(db, 'messages'), {
			text: message.text,
			createdAt: new Date(), // Store as Firestore timestamp
			user: {
				_id: userId, // Identify the sender
				name: name, // Display sender's name
			},
		});
		// Clear the input field
		setMessages((previousMessages) =>
			GiftedChat.append(previousMessages, [{ ...message, text: '' }])
		);
	};

	// Get Firebase Auth instance
	useEffect(() => {
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUserId(user.uid); // Set the Firebase user ID
				console.log('Authenticated User ID:', user.uid);
			} else {
				console.log('No authenticated user found');
			}
		});

		return () => unsubscribe(); // Cleanup auth listener
	}, []);

	// Fetch chat messages from Firestore in real-time
	useEffect(() => {
		if (!userId) return; // Wait until userId is available

		const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));

		// Subscribe to Firestore messages collection and listen for updates
		const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
			const loadedMessages = querySnapshot.docs.map((doc) => {
				const data = doc.data();

				return {
					_id: doc.id,
					text: data.text,
					createdAt: data.createdAt?.toDate(), // Convert Firestore timestamp to Date
					user: {
						_id: data.user?._id || 'unknown', // Ensure user ID is present
						name: data.user?.name || 'Unknown', // Ensure user name is present
					},
				};
			});

			setMessages(loadedMessages);
		});

		return () => unsubscribe(); // Cleanup listener on unmount
	}, [userId]); // Depend on userId to ensure correct alignment

	useEffect(() => {
		// Ensure automatic scrolling when new messages arrive
		if (messages.length > 0) {
			setTimeout(() => {
				setMessages((prevMessages) => [...prevMessages]);
			}, 100);
		}
	}, [messages]);

	useEffect(() => {
		// Set the navigation title to the user's name
		navigation.setOptions({ title: name || 'Chat' });
	}, [name, navigation]); //  Ensures the effect re-runs when `name` changes

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			{/* Main container with Dynamically set background color */}
			<View
				style={[
					styles.container,
					{ backgroundColor: selectedColor },
					keyboardVisible && styles.containerShifted,
				]}>
				{/* Chat interface component */}
				<GiftedChat
					messages={messages}
					onSend={(messages) => onSend(messages)}
					user={{
						_id: userId, // Pass correct userId from authentication
						name: name, // Pass user’s name
					}}
					listViewProps={{
						keyboardShouldPersistTaps: 'handled', // Ensures taps on the chat don’t dismiss the keyboard
						scrollsToTop: false, // Prevents scrolling to the top accidentally
					}}
					scrollToBottom // Enables scroll to bottom button
					scrollToBottomComponent={() => (
						<Ionicons
							name="chevron-down"
							size={30}
							color="#757083"
						/>
					)}
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
							containerStyle={[
								styles.inputToolbar,
								{ marginBottom: Platform.OS === 'ios' ? insets.bottom : 10 }, // Adjust for iOS insets
							]}
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
			</View>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	// Full-screen container with dynamic background color
	container: {
		flex: 1, // Ensures it takes full screen height
	},
	containerShifted: {
		flex: 1, // Adjust heights to shift up when the keyboard is open
		marginBottom: 0,
		paddingBottom: Platform.OS === 'android' ? 0 : 0, // More spacing for Android/iOS
	},
	inputToolbar: {
		width: '100%',
		alignSelf: 'center',
		minHeight: 50, // Ensures enough height for the input field
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#ddd',
		paddingBottom: 10,
		paddingHorizontal: 10,
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
