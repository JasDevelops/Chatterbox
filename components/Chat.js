import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableWithoutFeedback, Keyboard, Text } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chat = ({ route, navigation, db, auth, isConnected }) => {
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

	// Add listeners to check if keyboard is visible or not
	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
			setKeyboardVisible(true)
		);
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
			setKeyboardVisible(false)
		);

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	// Load cached messages from AsyncStorage when offline
	const loadCachedMessages = async () => {
		try {
			const cachedMessages = await AsyncStorage.getItem('messages');
			if (cachedMessages) {
				setMessages(JSON.parse(cachedMessages));
			}
		} catch (error) {
			console.error('Failed to load messages from AsyncStorage', error);
		}
	};

	// Cache messages to AsyncStorage
	const cacheMessages = async (messagesToCache) => {
		try {
			await AsyncStorage.setItem('messages', JSON.stringify(messagesToCache));
		} catch (error) {
			console.error('Failed to cache messages', error);
		}
	};

	// Function to handle sending new messages
	const onSend = (newMessages = []) => {
		if (!isConnected) {
			console.warn('Cannot send messages while offline.');
			return; // Block sending if offline
		}

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

		// Update local state and cache messages
		setMessages((previousMessages) => {
			const updatedMessages = GiftedChat.append(previousMessages, newMessages);
			cacheMessages(updatedMessages); // Cache the updated messages
			return updatedMessages;
		});
	};

	// Get Firebase Auth instance
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUserId(user.uid); // Set the Firebase user ID
			} else {
				console.log('No authenticated user found');
			}
		});

		return () => unsubscribe(); // Cleanup auth listener
	}, [auth]);

	// Fetch chat messages from Firestore in real-time when online
	useEffect(() => {
		let unsubscribe;
		if (userId && isConnected) {
			// Ensure user is online and userId is available before fetching

			const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
			// Subscribe to Firestore messages collection and listen for updates
			unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
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
				cacheMessages(loadedMessages); // Store in AsyncStorage
			});
		} else {
			loadCachedMessages(); // Load messages from cache when offline
		}
		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, [userId, isConnected]);

	// Ensure automatic scrolling when new messages arrive
	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => {
				setMessages((prevMessages) => [...prevMessages]);
			}, 100);
		}
	}, [messages]);

	// Set the navigation title to the user's name
	useEffect(() => {
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
					alwaysShowSend={isConnected} // Send button is only always visible when online
					keyboardShouldPersistTaps="handled" // Prevents chat from interfering with input
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
					// Prevent input components from rendering when offline
					renderInputToolbar={(props) =>
						isConnected ? (
							<InputToolbar
								{...props}
								containerStyle={[
									styles.inputToolbar,
									{ marginBottom: Platform.OS === 'ios' ? insets.bottom : 10 },
								]}
								accessibilityLabel="Message input field"
								accessibilityHint="Type a message and send it using the send button."
								accessibilityRole="text"
							/>
						) : null
					}
					renderComposer={(props) =>
						isConnected ? (
							<Composer
								{...props}
								textInputStyle={styles.composerInput} // Forces Input field to be visible
								accessibilityLabel="Type a message"
								accessibilityHint="Enter your chat message here."
								accessibilityRole="text"
							/>
						) : null
					}
					renderSend={(props) =>
						isConnected ? (
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
						) : null
					}
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
