import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: 16,
    },
    title: {
      fontSize: 24,
      marginBottom: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
  });
  
  const ChatScreen = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to the Chat Screen!</Text>
        <Text style={styles.subtitle}>This is where your chat content goes.</Text>
      </View>
    );
  };
  
  export default ChatScreen;