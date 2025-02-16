import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  userId: string;
}

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<{ [date: string]: Event[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('userId', '==', currentUser?.uid));
      const snapshot = await getDocs(q);

      const fetchedEvents: { [date: string]: Event[] } = {};
      snapshot.forEach((doc) => {
        const event = doc.data() as Event;
        if (!fetchedEvents[event.date]) {
          fetchedEvents[event.date] = [];
        }
        fetchedEvents[event.date].push({ ...event, id: doc.id });
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    }
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        date: selectedDate,
        userId: currentUser?.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'events'), eventData);
      
      // Reset form and close modal
      setEventTitle('');
      setEventDescription('');
      setModalVisible(false);
      
      // Refresh events
      fetchEvents();
      
      Alert.alert('Success', 'Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(events).forEach((date) => {
      marked[date] = { marked: true, dotColor: '#50cebb' };
    });
    return marked;
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={getMarkedDates()}
        theme={{
          todayTextColor: '#50cebb',
          selectedDayBackgroundColor: '#50cebb',
        }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event for {selectedDate}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Event Title"
              value={eventTitle}
              onChangeText={setEventTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Event Description"
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddEvent}
              >
                <Text style={styles.buttonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: '45%',
  },
  addButton: {
    backgroundColor: '#50cebb',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default CalendarScreen;