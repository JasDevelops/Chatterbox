import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

const MessageAudio = ({ currentMessage }) => {
	if (!currentMessage.audio) return null;

	const [sound, setSound] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [position, setPosition] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	// Helper function to check if the audio file exists
	const checkAudioFile = async (url) => {
		try {
			const response = await fetch(url, { method: 'HEAD' });
			return response.ok;
		} catch (err) {
			console.error('Error checking audio file existence:', err);
			return false;
		}
	};

	// Helper function to get the local cached URI of an audio file.
	// If the file is not cached, download it to the FileSystem cache directory.
	const getLocalAudioUri = async (remoteUri) => {
		// Extract the raw filename from the remote URI.
		const rawFilename = remoteUri.split('?')[0].split('/').pop();
		// Decode the filename to convert any URL-encoded characters into their literal form.
		const decodedFilename = decodeURIComponent(rawFilename);
		// Sanitize the filename by replacing any slashes with an underscore.
		const sanitizedFilename = decodedFilename.replace(/\//g, '_');

		// Define the local directory for audio caching.
		const directory = FileSystem.cacheDirectory + 'audio/';
		// Define the full local file path using the sanitized filename.
		const localUri = directory + sanitizedFilename;

		// Check if the directory exists; create it if it doesn't.
		const dirInfo = await FileSystem.getInfoAsync(directory);
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
		}

		// Check if the file is already cached.
		const fileInfo = await FileSystem.getInfoAsync(localUri);
		if (fileInfo.exists) {
			return localUri;
		}

		// File is not cached—download and save it locally.
		try {
			const { uri } = await FileSystem.downloadAsync(remoteUri, localUri);
			return uri;
		} catch (error) {
			console.error('Failed to download audio file', error);
			// Fallback: use the remote URI if download fails.
			return remoteUri;
		}
	};

	// Callback for audio playback status updates
	const onPlaybackStatusUpdate = (status) => {
		if (status.isLoaded) {
			setPosition(status.positionMillis);
			if (status.didJustFinish) {
				// When the audio finishes, explicitly pause it
				if (sound) {
					sound.pauseAsync();
				}
				setIsPlaying(false);
				setPosition(0);
				if (sound) {
					sound.setPositionAsync(0);
				}
			}
		}
	};
	useEffect(() => {
		let isMounted = true;

		const loadSound = async () => {
			setLoading(true);
			const fileExists = await checkAudioFile(currentMessage.audio);
			if (!fileExists) {
				if (isMounted) {
					setError(true);
					setLoading(false);
				}
				return;
			}

			const localAudioUri = await getLocalAudioUri(currentMessage.audio);

			try {
				const { sound: playbackSound } = await Audio.Sound.createAsync(
					{ uri: localAudioUri },
					{},
					onPlaybackStatusUpdate
				);
				// Diable auto-looping
				await playbackSound.setIsLoopingAsync(false);

				if (isMounted) {
					setSound(playbackSound);
					const status = await playbackSound.getStatusAsync();
					if (status.isLoaded) {
						setDuration(status.durationMillis);
					}
				}
			} catch (e) {
				if (isMounted) {
					setError(true);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadSound();

		return () => {
			isMounted = false;
			if (sound) {
				sound.unloadAsync();
			}
		};
	}, [currentMessage.audio]);

	// Toggle play/pause of the audio.
	const togglePlayback = async () => {
		if (!sound) return;
		const status = await sound.getStatusAsync();
		if (status.isPlaying) {
			await sound.pauseAsync();
			setIsPlaying(false);
		} else {
			await sound.playAsync();
			setIsPlaying(true);
		}
	};

	// Handle slider value changes for seeking.
	const onSliderValueChange = async (value) => {
		if (!sound) return;
		const seekPosition = value * duration;
		await sound.setPositionAsync(seekPosition);
	};

	// Helper to format time
	const formatTime = (millis) => {
		const totalSeconds = Math.floor(millis / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};
	if (loading) {
		return (
			<View style={[styles.container, styles.loadingContainer]}>
				<ActivityIndicator
					size="small"
					color="#757083"
				/>
			</View>
		);
	}
	// Render a loading indicator while the audio is being prepared.
	if (error) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>Audio not available</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={styles.playButton}
				onPress={togglePlayback}>
				<Ionicons
					name={isPlaying ? 'pause' : 'play'}
					size={24}
					color="#333"
				/>
			</TouchableOpacity>
			<View style={styles.sliderContainer}>
				<Slider
					style={styles.slider}
					minimumValue={0}
					maximumValue={1}
					value={duration ? position / duration : 0}
					onValueChange={onSliderValueChange}
					minimumTrackTintColor="#fff"
					maximumTrackTintColor="#000"
					thumbTintColor="#bc544b"
					thumbTouchSize={{ width: 20, height: 20 }}
				/>
			</View>
			<Text style={styles.timeText}>
				{formatTime(position)} / {formatTime(duration)}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 10,
		marginVertical: 5,
		alignItems: 'center',
	},
	playButton: {
		paddingStart: 5,
	},
	slider: {
		height: 30,
		width: '100%',
	},
	sliderContainer: {
		width: 90,
		marginLeft: 20,
		flexDirection: 'column',
		justifyContent: 'center',
	},
	timeText: {
		fontSize: 12,
		color: '#333',
		textAlign: 'right',
		width: 70,
	},
});
export default MessageAudio;
