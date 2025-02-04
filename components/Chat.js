import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';

const Chat = ({ route, navigation }) => {
	// Get user name & background color
	const { name, selectedColor } = route.params;

	useEffect(() => {
		// Set the navigation title to the user's name
		navigation.setOptions({ title: name || 'Chat' });
	}, [name, navigation]); //  Ensures the effect runs when `name` changes

	return (
		<View style={[styles.container, { backgroundColor: selectedColor }]}>
			{/*  Dynamically set background color */}
			<Text style={styles.welcomeText}>Hello {name || 'there'}!</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	// Full-screen container with dynamic background color
	container: {
		flex: 1, // Ensures it takes full screen height
		justifyContent: 'center',
		alignItems: 'center',
	},
	// Text that greets the user
	welcomeText: {
		fontSize: 18,
		fontWeight: 600,
		color: '#FFFFFF',
	},
});

export default Chat;
