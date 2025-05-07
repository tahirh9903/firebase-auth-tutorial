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
  SafeAreaView,
  Platform,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
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
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';
import { useAccessibility } from '../context/AccessibilityContext';
import { Ionicons } from '@expo/vector-icons';
console.log('KEY:', OPENAI_API_KEY);


interface Message {
  id: string;
  text: string;
  senderEmail: string;
  receiverEmail: string;
  timestamp: any;
  order: number;
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
  const { isDarkMode, textSize } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationsState, setConversationsState] = useState<ConversationState>({
    isLoading: true,
    data: []
  });
  const [newMessage, setNewMessage] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444444' : '#ddd';
  const messageBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const sentMessageBackgroundColor = isDarkMode ? '#0066cc' : '#50cebb';
  const inputBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const inputBorderColor = isDarkMode ? '#444444' : '#ddd';
  const modalBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const buttonBackgroundColor = isDarkMode ? '#0066cc' : '#50cebb';
  const cancelButtonBackgroundColor = isDarkMode ? '#444444' : '#ddd';

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

    // Add sample conversations if missing for each participant
    const addSampleConversations = async () => {
      const sampleChats = [
        {
          email: 'doctor@ai.com',
          name: 'Dr. Sarah AI',
          avatar: '👩‍⚕️',
          messages: [
            { text: "Hello! I'm Dr. Sarah. How can I help you today?", sender: 'doctor' },
            { text: "Hi Doctor, I've been having headaches recently.", sender: 'user' },
            { text: "I understand. How long have you been experiencing these headaches? Are they accompanied by any other symptoms?", sender: 'doctor' },
            { text: "They started about 3 days ago, and I also feel a bit dizzy sometimes.", sender: 'user' },
            { text: "Thank you for sharing that. Have you noticed any triggers for the headaches? For example, stress, lack of sleep, or certain foods?", sender: 'doctor' },
            { text: "I think it might be related to stress at work. I've been working long hours lately.", sender: 'user' },
            { text: "That's helpful to know. I recommend trying some stress management techniques and ensuring you get 7-8 hours of sleep. Would you like me to suggest some specific relaxation exercises?", sender: 'doctor' },
            { text: "Yes, that would be helpful. Thank you.", sender: 'user' },
            { text: "Here are a few simple exercises you can try:\n1. Deep breathing: 4-7-8 technique\n2. Progressive muscle relaxation\n3. 5-minute meditation\nWould you like me to explain any of these in detail?", sender: 'doctor' }
          ]
        },
        {
          email: 'pharmacy@healthplus.com',
          name: 'HealthPlus Pharmacy',
          avatar: '💊',
          messages: [
            { text: "Welcome to HealthPlus Pharmacy. How may we assist you?", sender: 'pharmacy' },
            { text: "Hi, I'd like to check if my prescription is ready for pickup.", sender: 'user' },
            { text: "I'll be happy to help you check that. Could you please provide your prescription number?", sender: 'pharmacy' },
            { text: "Yes, it's RX-2024-5678", sender: 'user' },
            { text: "Thank you. I can see that your prescription for amoxicillin is ready for pickup. It was filled this morning. Would you like to schedule a pickup time?", sender: 'pharmacy' },
            { text: "Yes, I can come by in about an hour. Is that okay?", sender: 'user' },
            { text: "That works perfectly! We'll have it ready for you. Don't forget to bring your ID and insurance card. Is there anything else you need help with?", sender: 'pharmacy' },
            { text: "No, that's all. Thank you for your help!", sender: 'user' },
            { text: "You're welcome! We'll see you soon. Have a great day!", sender: 'pharmacy' }
          ]
        },
        {
          email: 'nurse@clinic.com',
          name: 'Nurse Sarah',
          avatar: '👩‍⚕️',
          messages: [
            { text: "Hi, I'm Nurse Sarah. I'll be helping coordinate your care.", sender: 'nurse' },
            { text: "Hello Nurse Sarah, I need to schedule a follow-up appointment.", sender: 'user' },
            { text: "Of course! I can help you with that. What's your preferred day and time?", sender: 'nurse' },
            { text: "I'm available on Thursday afternoon or Friday morning.", sender: 'user' },
            { text: "Great! I can see we have an opening on Thursday at 2:30 PM or Friday at 10:00 AM. Which would you prefer?", sender: 'nurse' },
            { text: "Thursday at 2:30 PM works best for me.", sender: 'user' },
            { text: "Perfect! I've scheduled your appointment for Thursday at 2:30 PM with Dr. Johnson. Please arrive 15 minutes early to complete any necessary paperwork. Is there anything else you need help with?", sender: 'nurse' },
            { text: "No, that's all. Thank you for your help!", sender: 'user' },
            { text: "You're welcome! We'll send you a reminder text the day before your appointment. Have a great day!", sender: 'nurse' }
          ]
        },
        {
          email: 'dietitian@healthplus.com',
          name: 'Nutrition Expert',
          avatar: '🥗',
          messages: [
            { text: "Hello! I'm your nutrition expert. How can I help you with your dietary needs today?", sender: 'dietitian' },
            { text: "Hi! I'm trying to eat healthier and lose some weight. Can you give me some advice?", sender: 'user' },
            { text: "I'd be happy to help! Could you tell me a bit about your current eating habits and any specific goals you have?", sender: 'dietitian' },
            { text: "I usually skip breakfast, eat fast food for lunch, and have a big dinner. I'd like to lose about 10 pounds.", sender: 'user' },
            { text: "Thank you for sharing that. Here are some initial recommendations:\n1. Start with a healthy breakfast\n2. Plan your meals ahead\n3. Stay hydrated\nWould you like me to provide some specific meal ideas?", sender: 'dietitian' },
            { text: "Yes, that would be really helpful!", sender: 'user' },
            { text: "Here are some balanced meal ideas:\nBreakfast: Greek yogurt with berries and granola\nLunch: Grilled chicken salad with mixed vegetables\nDinner: Baked salmon with quinoa and steamed vegetables\nWould you like me to provide more options or focus on any specific meal?", sender: 'dietitian' }
          ]
        }
      ];

      for (const chat of sampleChats) {
        // Check if any messages exist for this participant
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('participants', 'array-contains', currentUser.email));
        const querySnapshot = await getDocs(q);
        const hasChat = querySnapshot.docs.some(doc => {
          const data = doc.data();
          return data.participants && data.participants.includes(chat.email);
        });
        if (!hasChat) {
          for (let i = 0; i < chat.messages.length; i++) {
            const msg = chat.messages[i];
            await addDoc(collection(db, 'messages'), {
              text: msg.text,
              senderEmail: msg.sender === 'user' ? currentUser.email : chat.email,
              receiverEmail: msg.sender === 'user' ? chat.email : currentUser.email,
              order: i, // add order field for logical ordering
              participants: [currentUser.email, chat.email].sort(),
              senderName: msg.sender === 'user' ? currentUser.displayName : chat.name,
              senderAvatar: chat.avatar
            });
          }
        }
      }
    };

    addSampleConversations();

    // Create a real-time listener for messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.email)
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
              order: data.order,
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

          // Sort messages by timestamp
          const sortedMessages = messageList.sort((a, b) => 
            (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
          );

          // Update messages state
          setMessages(sortedMessages);

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
  }, [currentUser?.email]);

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim() || !(receiverEmail || selectedChat)) {
      Alert.alert('Error', 'Please enter a message and recipient');
      return;
    }

    const targetEmail = selectedChat || receiverEmail;
    const censoredMessage = censorProfanity(newMessage.trim());

    try {
      const messageData = {
        text: censoredMessage,
        senderEmail: currentUser.email || '',
        receiverEmail: targetEmail,
        timestamp: serverTimestamp(),
        participants: [currentUser.email || '', targetEmail].sort(),
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      const newMessageObj: Message = {
        id: docRef.id,
        text: censoredMessage,
        senderEmail: currentUser.email || '',
        receiverEmail: targetEmail,
        timestamp: new Date(),
        order: 0, // Assuming a default order
      };

      setMessages(prev => [newMessageObj, ...prev]);

      const newConversation: Conversation = {
        email: targetEmail,
        lastMessage: censoredMessage,
        timestamp: new Date(),
        unread: false,
      };

      setConversationsState(prev => ({
        ...prev,
        data: [newConversation, ...prev.data.filter(conv => conv.email !== targetEmail)],
      }));

      setNewMessage('');
      if (!selectedChat) setSelectedChat(targetEmail);

      // 👨‍⚕️ Trigger AI doctor response if chatting with the AI
      if (targetEmail === 'doctor@ai.com') {
        const aiReply = await callOpenAIDoctor(censoredMessage);

        const aiMessageData = {
          text: aiReply,
          senderEmail: 'doctor@ai.com',
          receiverEmail: currentUser.email,
          timestamp: serverTimestamp(),
          participants: [currentUser.email, 'doctor@ai.com'].sort(),
        };

        await addDoc(collection(db, 'messages'), aiMessageData);
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
      if (receiverEmail === 'doctor@ai.com') {
        setSelectedChat(receiverEmail);
        hideNewChatModal();
        return;
      }

      // Verify receiver email exists in users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', receiverEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Recipient email not found');
        return;
      }

      setSelectedChat(receiverEmail);
      hideNewChatModal();
    } catch (error) {
      console.error('Error starting new chat:', error);
      Alert.alert('Error', 'Failed to start new chat');
    }
  };

  // Render conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => selectChat(item.email)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.email === 'doctor@ai.com' ? '👩‍⚕️' : item.email === 'pharmacy@healthplus.com' ? '💊' : item.email === 'nurse@clinic.com' ? '👩‍⚕️' : item.email === 'dietitian@healthplus.com' ? '🥗' : '👤'}</Text>
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>
          {item.email === 'doctor@ai.com' ? 'Dr. Sarah AI' : 
           item.email === 'pharmacy@healthplus.com' ? 'HealthPlus Pharmacy' : 
           item.email === 'nurse@clinic.com' ? 'Nurse Sarah' :
           item.email === 'dietitian@healthplus.com' ? 'Nutrition Expert' :
           item.email}
        </Text>
        <Text style={styles.conversationLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderEmail === currentUser?.email
          ? styles.sentMessage
          : styles.receivedMessage,
      ]}
    >
      {item.senderEmail !== currentUser?.email && (
        <View style={styles.messageAvatarContainer}>
          <Text style={styles.messageAvatar}>
            {item.senderEmail === 'doctor@ai.com' ? '👩‍⚕️' : 
             item.senderEmail === 'pharmacy@healthplus.com' ? '💊' : 
             item.senderEmail === 'nurse@clinic.com' ? '👩‍⚕️' :
             item.senderEmail === 'dietitian@healthplus.com' ? '🥗' :
             '👤'}
          </Text>
        </View>
      )}
      <View style={styles.messageContent}>
        {item.senderEmail !== currentUser?.email && (
          <Text style={styles.messageSender}>
            {item.senderEmail === 'doctor@ai.com' ? 'Dr. Sarah AI' : 
             item.senderEmail === 'pharmacy@healthplus.com' ? 'HealthPlus Pharmacy' : 
             item.senderEmail === 'nurse@clinic.com' ? 'Nurse Sarah' :
             item.senderEmail === 'dietitian@healthplus.com' ? 'Nutrition Expert' :
             item.senderEmail}
          </Text>
        )}
        <View style={[
          styles.bubble,
          item.senderEmail === currentUser?.email
            ? styles.bubbleSent
            : styles.bubbleReceived,
        ]}>
          <Text style={[
            styles.messageText,
            { color: item.senderEmail === currentUser?.email ? '#fff' : textColor }
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    </View>
  );

  // --- Chat Section with KeyboardAvoidingView and Scroll-to-bottom ---
  const ChatSection = () => {
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const flatListRef = React.useRef<FlatList<any>>(null);

    // Scroll to bottom handler
    const scrollToBottom = () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    // Show scroll-to-bottom button if not at bottom
    const handleScroll = (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollToBottom(offsetY > 100);
    };

    // Filter and sort messages for this chat
    const chatMessages = messages
      .filter(
        msg =>
          (msg.senderEmail === currentUser?.email && msg.receiverEmail === selectedChat) ||
          (msg.receiverEmail === currentUser?.email && msg.senderEmail === selectedChat)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // sort by order field for logical order

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              inverted
              contentContainerStyle={styles.messagesList}
              onScroll={handleScroll}
              showsVerticalScrollIndicator={true}
            />
            {showScrollToBottom && (
              <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
                <Ionicons name="chevron-down" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {/* Always show the input bar at the bottom */}
            <View style={[styles.inputContainer, { backgroundColor: headerBackgroundColor }]}> 
              <TextInput
                style={[styles.input, {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }]}
                placeholder="Type a message..."
                placeholderTextColor={secondaryTextColor}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  };

  if (!selectedChat) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Messages</Text>
            <TouchableOpacity style={styles.headerPlusButton} onPress={startNewChat}>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={conversationsState.data}
            keyExtractor={(item) => item.email}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
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
            <View style={styles.modalContainer} pointerEvents="box-none">
              <View style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>New Message</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: inputBackgroundColor,
                    borderColor: inputBorderColor,
                    color: textColor
                  }]}
                  placeholder="Enter recipient email"
                  placeholderTextColor={secondaryTextColor}
                  value={receiverEmail}
                  onChangeText={setReceiverEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={true}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: cancelButtonBackgroundColor }]}
                    onPress={hideNewChatModal}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleNewChat}
                  >
                    <Text style={styles.buttonText}>Start Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setSelectedChat(null)}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <Text style={styles.headerAvatar}>
              {selectedChat === 'doctor@ai.com' ? '👩‍⚕️' : 
               selectedChat === 'pharmacy@healthplus.com' ? '💊' : 
               selectedChat === 'nurse@clinic.com' ? '👩‍⚕️' :
               selectedChat === 'dietitian@healthplus.com' ? '🥗' :
               '👤'}
            </Text>
            <Text style={[styles.headerText, { color: textColor }]}>
              {selectedChat === 'doctor@ai.com' ? 'Dr. Sarah AI' : 
               selectedChat === 'pharmacy@healthplus.com' ? 'HealthPlus Pharmacy' : 
               selectedChat === 'nurse@clinic.com' ? 'Nurse Sarah' :
               selectedChat === 'dietitian@healthplus.com' ? 'Nutrition Expert' :
               selectedChat}
            </Text>
          </View>
        </View>
        <ChatSection />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },
  headerPlusButton: {
    backgroundColor: '#50cebb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listContainer: {
    padding: 12,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#50cebb',
    marginLeft: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
    maxWidth: '85%',
    paddingHorizontal: 8,
  },
  messageAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  bubble: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 2,
    maxWidth: '100%',
  },
  bubbleSent: {
    backgroundColor: '#50cebb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#50cebb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#50cebb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 0.48,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 24,
    bottom: 80,
    backgroundColor: '#50cebb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
// AI doctor reply logic
const callOpenAIDoctor = async (userMessage: string): Promise<string> => {
  try {
    const response = await axios.post(
      'http://localhost:3001/openai',
      { message: userMessage },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.reply;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Proxy API error:', error.message);
    } else if (axios.isAxiosError(error) && error.response) {
      console.error('Proxy API error:', error.response.data);
    } else {
      console.error('Proxy API error:', error);
    }
    return 'Sorry, the doctor is currently unavailable.';
  }
};

export default ChatScreen;