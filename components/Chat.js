import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	Text,
	Image,
	TouchableOpacity,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import { Audio } from 'expo-av';

import Actions from './Actions';
import MessageAudio from './MessageAudio';

const Chat = ({ route, navigation, db, auth, storage, isConnected }) => {
	// Get safe are inset for proper spacing on devices with notches
	const insets = useSafeAreaInsets();
	// Use state for userId
	const [userId, setUserId] = useState(null);
	// Get user ID, name & background color
	const { name, selectedColor } = route.params;
	// State to manage chat messages
	const [messages, setMessages] = useState([]);
	//State to detect if keyboard is open
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	// Default comment bubble to 'right'
	const [alignment, setBubbleAlignment] = useState('right');

	// Load alignment from AsyncStorage when the component mounts
	useEffect(() => {
		const loadAlignment = async () => {
			try {
				const savedAlignment = await AsyncStorage.getItem('alignment');
				if (savedAlignment) {
					setBubbleAlignment(savedAlignment);
				}
			} catch (error) {
				console.error('Failed to load alignment from AsyncStorage', error);
			}
		};
		loadAlignment();
	}, []);

	// Save bubble alignment to AsyncStorage
	useEffect(() => {
		const saveAlignment = async () => {
			try {
				await AsyncStorage.setItem('alignment', alignment);
			} catch (error) {
				console.error('Failed to save alignment to AsyncStorage', error);
			}
		};
		saveAlignment();
	}, [alignment]);

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
			text: message.text || '',
			image: message.image || '',
			location: message.location || null,
			audio: message.audio || '',
			createdAt: new Date(), // Store as Firestore timestamp
			user: {
				_id: userId || 'unknown', // Ensure user ID is present
				name: name || 'Anonymous', // Ensure name is present
			},
		});

		// Update local state and cache messages
		setMessages((previousMessages) => {
			const updatedMessages = GiftedChat.append(previousMessages, newMessages);
			cacheMessages(updatedMessages); // Cache the updated messages
			return updatedMessages;
		});
	};

	// Listen for authentication state changes to set the user ID
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUserId(user.uid); // Set the Firebase user ID
			} else {
				('No authenticated user found');
			}
		});
		return () => unsubscribe(); // Cleanup auth listener on unmount
	}, [auth]);

	// Load cached messages once the user ID is available
	useEffect(() => {
		if (userId) {
			loadCachedMessages();
		}
	}, [userId]); // This will run when userId changes

	// Fetch chat messages from Firestore in real-time when online
	useEffect(() => {
		let unsubscribe;
		if (userId && isConnected) {
			// Create a query for messages ordered by creation date in descending order
			const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
			// Listen for snapshot updates from Firestore
			unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
				const loadedMessages = querySnapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						_id: doc.id,
						text: data.text,
						image: data.image,
						location: data.location,
						audio: data.audio,
						createdAt: data.createdAt ? data.createdAt.toDate() : new Date(), // Convert Firestore timestamp to Date
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

	// Function that returns Action component
	const renderActions = (props) => (
		<Actions
			storage={storage}
			onSend={onSend}
			userId={userId}
			{...props}
		/>
	);

	// Function to render a map view when a message includes location data
	const renderCustomView = (props) => {
		const { currentMessage } = props;
		if (currentMessage.location) {
			const { latitude, longitude } = currentMessage.location;
			return (
				<MapView
					style={{ width: 150, height: 100, borderRadius: 10 }}
					region={{
						latitude: latitude,
						longitude: longitude,
						latitudeDelta: 0.01,
						longitudeDelta: 0.01,
					}}>
					<Marker coordinate={{ latitude, longitude }} />
				</MapView>
			);
		}
		return null;
	};

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
					renderActions={renderActions} // Use the custom ActionSheet
					renderCustomView={renderCustomView} // Render map if location data exists
					renderMessageAudio={(props) => <MessageAudio {...props} />} // Render MessageAudio
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
					renderBubble={(props) => {
						const isCurrentUser = props.currentMessage.user?._id === userId; // Check if message is from the current user
						return (
							<Bubble
								{...props}
								wrapperStyle={{
									right: isCurrentUser
										? { backgroundColor: '#757083' }
										: { backgroundColor: '#f0f0f0' },
									left: { backgroundColor: '#f0f0f0' },
								}}
								containerStyle={{
									right: isCurrentUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
									left: { alignSelf: 'flex-start' },
								}}
								accessibilityLabel="Chat bubble"
								accessibilityHint="Contains the chat message content."
								accessibilityRole="text"
								// Inline error-handling for image messages
								renderMessageImage={(props) => {
									// Define an inline component for rendering images with error handling
									const RenderImage = () => {
										// Local state for tracking image loading errors
										const [error, setError] = React.useState(false);
										if (error) {
											// Fallback view if image fails to load
											return (
												<View
													style={{
														width: 200,
														height: 200,
														borderRadius: 10,
														backgroundColor: '#ccc',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													<Text style={{ color: '#333' }}>Image not available</Text>
												</View>
											);
										}
										return (
											<Image
												source={{ uri: props.currentMessage.image }}
												style={{ width: 200, height: 200, borderRadius: 10 }}
												accessibilityLabel="Image message"
												accessible={true}
												onError={() => setError(true)}
											/>
										);
									};
									return <RenderImage />;
								}}
							/>
						);
					}}
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
					// Only render the input toolbar when online
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
					// Only render the composer when online
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
					// Only render the send button when online
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
	// Container adjustments when the keyboard is open
	containerShifted: {
		flex: 1,
		marginBottom: 0,
		paddingBottom: Platform.OS === 'android' ? 0 : 0, // More spacing for Android/iOS
	},
	// Styling for the input toolbar (message input container)
	inputToolbar: {
		width: '100%',
		alignSelf: 'center',
		minHeight: 50,
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#ddd',
		paddingBottom: 10,
		paddingHorizontal: 10,
	},
	// Styling for the text input (composer)
	composerInput: {
		color: '#000',
		fontSize: 16,
		paddingVertical: 10,
		backgroundColor: '#fff',
		borderRadius: 20,
		paddingHorizontal: 10,
		minHeight: 40,
		flex: 1,
	},
	// Container for the send button
	sendButtonContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 5,
		paddingRight: 5,
	},
});

export default Chat;
