import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const Actions = ({ storage, onSend, userId }) => {
	// To display more than 3 options in Actionsheet for Android
	const { showActionSheetWithOptions } = useActionSheet();
	// Upload and send image
	const uploadImage = async (imageUri) => {
		try {
			if (!userId) {
				console.error('Error: User ID is missing');
				Alert.alert('Error', 'User is not authenticated.');
				return;
			}
			// Ensure imageUri is valid
			const response = await fetch(imageUri);
			if (!response.ok) throw new Error('Failed to fetch image');

			const blob = await response.blob();

			const uniqueImageName = `uploads/${userId}/${uuidv4()}.jpg`;
			const imageRef = ref(storage, uniqueImageName);

			await uploadBytes(imageRef, blob);

			const imageUrl = await getDownloadURL(imageRef);

			// Send image as a message
			onSend([
				{
					_id: uuidv4(),
					image: imageUrl,
					createdAt: new Date(),
					user: { _id: userId },
				},
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to upload image. Please try again.');
			console.error(error);
		}
	};

	// Upload audio to Firebase storage
	const uploadAudio = async (audioUri) => {
		try {
			if (!userId) {
				console.error('Error: User ID is missing');
				Alert.alert('Error', 'User is not authenticated.');
				return;
			}
			const response = await fetch(audioUri);
			if (!response.ok) throw new Error('Failed to fetch audio');

			const blob = await response.blob();

			// Save as .m4a
			const uniqueAudioName = `audio/${userId}/${uuidv4()}.m4a`;
			const audioRef = ref(storage, uniqueAudioName);

			await uploadBytes(audioRef, blob);
			('Audio upload successful');

			const audioUrl = await getDownloadURL(audioRef);

			// Send audio
			onSend([
				{
					_id: uuidv4(),
					audio: audioUrl,
					createdAt: new Date(),
					user: { _id: userId },
				},
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to upload audio. Please try again.');
			console.error(error);
		}
	};

	// Record audio
	const recordAudio = async () => {
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: false,
				interruptionModeIOS: InterruptionModeIOS.DoNotMix,
				interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
				staysActiveInBackground: false,
			});
			// Then request microphone permission & start recording
			const { status } = await Audio.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'We need access to your microphone.');
				return;
			}

			const recording = new Audio.Recording();
			await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
			await recording.startAsync();
			('Recording started');

			// Wait until user presses OK to stop
			Alert.alert(
				'Recording Audio',
				'Recording... press OK to stop',
				[
					{
						text: 'OK',
						onPress: async () => {
							try {
								await recording.stopAndUnloadAsync();
								('Recording stopped');

								const uri = recording.getURI();
								if (uri) {
									// Upload and send as audio message
									await uploadAudio(uri);
								}
							} catch (err) {
								console.error('Error stopping audio:', err);
							}
						},
					},
				],
				{ cancelable: false }
			);
		} catch (error) {
			Alert.alert('Error', 'Failed to record audio. Please try again.');
			console.error(error);
		}
	};
	// Pick an image from library
	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission Denied', 'We need access to your photo library.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
		if (!result.canceled) {
			uploadImage(result.assets[0].uri);
		}
	};

	// Take a photo
	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission Denied', 'We need access to your camera.');
			return;
		}

		const result = await ImagePicker.launchCameraAsync({ quality: 1 });
		if (!result.canceled) {
			uploadImage(result.assets[0].uri);
		}
	};

	// Share location
	const shareLocation = async () => {
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
			return;
		}

		const location = await Location.getCurrentPositionAsync({});
		onSend([
			{
				_id: uuidv4(),
				location: {
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				},
				createdAt: new Date(),
				user: { _id: userId },
			},
		]);
	};

	// Open ActionSheet with all options
	const openActionSheet = () => {
		const options = [
			'Select an image from library',
			'Take a photo',
			'Share location',
			'Record audio',
			'Cancel',
		];
		const cancelButtonIndex = 4;

		showActionSheetWithOptions(
			{
				title: 'More options',
				message: 'Choose an action',
				options,
				cancelButtonIndex,
			},
			(buttonIndex) => {
				if (buttonIndex === 0) pickImage();
				if (buttonIndex === 1) takePhoto();
				if (buttonIndex === 2) shareLocation();
				if (buttonIndex === 3) recordAudio();
			}
		);
	};

	return (
		<TouchableOpacity
			style={{ marginLeft: 10, marginBottom: 5 }}
			onPress={openActionSheet}
			accessible={true}
			accessibilityLabel="More options"
			accessibilityHint="Opens a menu to send images or share location."
			accessibilityRole="button">
			<Ionicons
				name="add-circle-outline"
				size={28}
				color="#757083"
			/>
		</TouchableOpacity>
	);
};

export default Actions;
