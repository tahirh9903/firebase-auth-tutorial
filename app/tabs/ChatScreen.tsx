import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Message {
  id: string;
  text: string;
  senderEmail: string;
  receiverEmail: string;
  timestamp: any;
}

interface Conversation {
  email: string;
  lastMessage: string;
  timestamp: any;
  unread?: boolean;
}

interface ConversationState {
  isLoading: boolean;
  data: Conversation[];
}

// Add this censoring utility at the top of the file, after imports
const censorProfanity = (text: string): string => {
  // Add common profanity words to this array
  const profanityList = [
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'piss',
    // Add variations
    'fucking', 'fucked', 'shitting', 'damned', 'asshole', 'bitches'
  ];

  let censoredText = text;
  profanityList.forEach(word => {
    // Create a regex that matches the word case-insensitively
    const regex = new RegExp(word, 'gi');
    // Replace with the same number of # characters
    censoredText = censoredText.replace(regex, '#'.repeat(word.length));
  });

  return censoredText;
};

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationsState, setConversationsState] = useState<ConversationState>({
    isLoading: true,
    data: []
  });
  const [newMessage, setNewMessage] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Don't reset conversations here
      } else {
        setCurrentUser(null);
        setConversationsState({ isLoading: false, data: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // Set loading state
    setConversationsState(prev => ({ ...prev, isLoading: true }));

    // Create a real-time listener for messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.email),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const messageList: Message[] = [];
          const conversationMap = new Map<string, Conversation>();

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Validate required fields
            if (!data.senderEmail || !data.receiverEmail || !data.participants) {
              console.warn('Skipping invalid message document:', doc.id);
              return;
            }

            // Add to messages list
            messageList.push({
              id: doc.id,
              text: data.text,
              senderEmail: data.senderEmail,
              receiverEmail: data.receiverEmail,
              timestamp: data.timestamp,
            });

            // Update conversation map
            const otherParticipant = data.participants.find(
              (email: string) => email !== currentUser.email
            );

            if (otherParticipant && !conversationMap.has(otherParticipant)) {
              conversationMap.set(otherParticipant, {
                email: otherParticipant,
                lastMessage: data.text,
                timestamp: data.timestamp || new Date(),
                unread: data.senderEmail !== currentUser.email,
              });
            }
          });

          // Update messages state
          setMessages(messageList);

          // Update conversations state
          setConversationsState({
            isLoading: false,
            data: Array.from(conversationMap.values()).sort((a, b) => 
              (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
            )
          });
        } catch (error) {
          console.error('Error processing messages:', error);
          setConversationsState(prev => ({ ...prev, isLoading: false }));
        }
      },
      (error) => {
        console.error('Error in messages snapshot:', error);
        setConversationsState(prev => ({ ...prev, isLoading: false }));
      }
    );

    // Cleanup listener on unmount or when currentUser changes
    return () => unsubscribe();
  }, [currentUser?.email]); // Only re-run when email changes

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim() || !(receiverEmail || selectedChat)) {
      Alert.alert('Error', 'Please enter a message and recipient');
      return;
    }

    const targetEmail = selectedChat || receiverEmail;
    // Censor the message before sending
    const censoredMessage = censorProfanity(newMessage.trim());

    try {
      // Create message data with censored text
      const messageData = {
        text: censoredMessage,
        senderEmail: currentUser?.email || '',
        receiverEmail: targetEmail,
        timestamp: serverTimestamp(),
        participants: [currentUser?.email || '', targetEmail].sort(),
      };

      // Add message to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Add censored message to local state immediately
      const newMessageObj: Message = {
        id: docRef.id,
        text: censoredMessage,
        senderEmail: currentUser.email || '',
        receiverEmail: targetEmail,
        timestamp: new Date(),
      };

      setMessages(prevMessages => [newMessageObj, ...prevMessages]);

      // Update conversations with censored message
      const newConversation: Conversation = {
        email: targetEmail,
        lastMessage: censoredMessage,
        timestamp: new Date(),
        unread: false
      };

      setConversationsState(prev => ({
        ...prev,
        data: [newConversation, ...prev.data.filter(conv => conv.email !== targetEmail)]
      }));

      // Clear message input
      setNewMessage('');

      // If this is a new chat, update the UI
      if (!selectedChat) {
        setSelectedChat(targetEmail);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const selectChat = (email: string) => {
    setSelectedChat(email);
    setReceiverEmail(email);
  };

  const startNewChat = () => {
    setSelectedChat(null);
    setReceiverEmail('');
    showNewChatModal();
  };

  const [showNewChat, setShowNewChat] = useState(false);
  
  const showNewChatModal = () => setShowNewChat(true);
  const hideNewChatModal = () => setShowNewChat(false);

  const handleNewChat = async () => {
    if (!receiverEmail.trim()) {
      Alert.alert('Error', 'Please enter a recipient email');
      return;
    }

    try {
      // Verify receiver email exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', receiverEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Recipient email not found');
        return;
      }

      // Start chat with this user
      setSelectedChat(receiverEmail);
      hideNewChatModal();
    } catch (error) {
      console.error('Error starting new chat:', error);
      Alert.alert('Error', 'Failed to start new chat');
    }
  };

  if (!selectedChat) {
    // Show conversations list
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Messages</Text>
          <TouchableOpacity 
            style={styles.newChatButton} 
            onPress={startNewChat}
          >
            <Text style={styles.newChatButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversationsState.data}
          keyExtractor={(item) => item.email}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => selectChat(item.email)}
            >
              <View style={styles.conversationContent}>
                <Text style={styles.emailText}>{item.email}</Text>
                <Text style={styles.lastMessageText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {conversationsState.isLoading 
                  ? 'Loading conversations...' 
                  : 'No conversations yet'}
              </Text>
            </View>
          )}
        />

        {/* New Chat Modal */}
        <Modal
          visible={showNewChat}
          transparent={true}
          animationType="slide"
          onRequestClose={hideNewChatModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter recipient email"
                value={receiverEmail}
                onChangeText={setReceiverEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={hideNewChatModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.startButton]}
                  onPress={handleNewChat}
                >
                  <Text style={styles.buttonText}>Start Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Show chat messages
  const chatMessages = messages.filter(
    msg => 
      (msg.senderEmail === currentUser?.email && msg.receiverEmail === selectedChat) ||
      (msg.receiverEmail === currentUser?.email && msg.senderEmail === selectedChat)
  ).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedChat(null)}
        >
          <Text>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{selectedChat}</Text>
      </View>

      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderEmail === currentUser?.email
                ? styles.sentMessage
                : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#50cebb',
    marginLeft: 10,
  },
  lastMessageText: {
    color: '#666',
    fontSize: 14,
  },
  messageContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#50cebb',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#50cebb',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#50cebb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#50cebb',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ChatScreen;