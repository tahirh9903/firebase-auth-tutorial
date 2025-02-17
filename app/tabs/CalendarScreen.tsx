import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getFirestore 
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

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
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Get Firestore instance directly
  const firestore = getFirestore(app);

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
      const eventsRef = collection(firestore, 'events');
      const q = query(eventsRef, where('userId', '==', currentUser?.uid));
      const snapshot = await getDocs(q);

      const fetchedEvents: { [date: string]: Event[] } = {};
      snapshot.forEach((doc) => {
        const eventData = doc.data();
        const event: Event = {
          id: doc.id,
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          userId: eventData.userId
        };
        
        if (!fetchedEvents[event.date]) {
          fetchedEvents[event.date] = [];
        }
        fetchedEvents[event.date].push(event);
      });

      console.log('Fetched events:', fetchedEvents);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    }
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const dayEvents = events[day.dateString] || [];
    setSelectedEvents(dayEvents);
    
    if (dayEvents.length > 0) {
      // If there are events, show them in a list
      setModalVisible(true);
      setIsEditMode(false);
      setEditingEvent(null);
      setEventTitle('');
      setEventDescription('');
    } else {
      // If no events, open the add event modal
      setModalVisible(true);
      setIsEditMode(false);
      setEditingEvent(null);
      setEventTitle('');
      setEventDescription('');
    }
  };

  const handleEditEvent = (event: Event) => {
    setIsEditMode(true);
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDescription(event.description);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      const eventRef = doc(firestore, 'events', editingEvent.id);
      await updateDoc(eventRef, {
        title: eventTitle,
        description: eventDescription,
        updatedAt: serverTimestamp(),
      });

      // Reset form and close modal
      setEventTitle('');
      setEventDescription('');
      setModalVisible(false);
      setIsEditMode(false);
      setEditingEvent(null);

      // Refresh events
      fetchEvents();

      Alert.alert('Success', 'Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) {
      console.error('No event ID provided');
      return;
    }

    console.log('Attempting to delete event with ID:', eventId);
    
    try {
      // Delete from Firestore
      const eventRef = doc(firestore, 'events', eventId);
      await deleteDoc(eventRef);
      console.log('Successfully deleted from Firestore');

      // Update local state immediately
      setEvents(prevEvents => {
        const newEvents = { ...prevEvents };
        // Remove the event from all dates
        Object.keys(newEvents).forEach(date => {
          newEvents[date] = newEvents[date].filter(event => event.id !== eventId);
          // Remove date key if no events remain
          if (newEvents[date].length === 0) {
            delete newEvents[date];
          }
        });
        return newEvents;
      });

      setSelectedEvents(prev => prev.filter(event => event.id !== eventId));
      setModalVisible(false);
      
      Alert.alert('Success', 'Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
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

      await addDoc(collection(firestore, 'events'), eventData);
      
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
            {!isEditMode && selectedEvents.length > 0 ? (
              // Show list of events
              <>
                <Text style={styles.modalTitle}>Events for {selectedDate}</Text>
                {selectedEvents.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          onPress={() => handleEditEvent(event)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Delete button pressed for event:', event.id);
                            handleDeleteEvent(event.id);
                          }}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={() => {
                    setIsEditMode(false);
                    setEditingEvent(null);
                    setEventTitle('');
                    setEventDescription('');
                    setSelectedEvents([]);
                  }}
                >
                  <Text style={styles.buttonText}>Add New Event</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Show add/edit form
              <>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'Edit Event' : `Add Event for ${selectedDate}`}
                </Text>
                
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
                    onPress={() => {
                      setModalVisible(false);
                      setIsEditMode(false);
                      setEditingEvent(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={isEditMode ? handleUpdateEvent : handleAddEvent}
                  >
                    <Text style={styles.buttonText}>
                      {isEditMode ? 'Update Event' : 'Add Event'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  eventItem: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#50cebb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;