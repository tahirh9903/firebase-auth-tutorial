import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, SafeAreaView } from 'react-native';
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
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  userId: string;
  timeSlot?: string;
  category?: string;
  taskType?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  doctorNPI?: string;
  createdAt?: any; // Firebase Timestamp
  type?: string;
  status?: string;
  taskCategory?: string;
}

type CalendarScreenRouteProp = RouteProp<{
  Calendar: {
    editMode?: boolean;
    eventToEdit?: Event;
    selectedDoctor?: any;
  };
}, 'Calendar'>;

interface CalendarScreenProps {
  route?: CalendarScreenRouteProp;
}

const TASK_CATEGORIES = [
  {
    id: 'exercise',
    title: 'Exercise',
    icon: 'fitness-outline',
    color: '#4CAF50',
    description: 'Workout, yoga, or any physical activity'
  },
  {
    id: 'medicine',
    title: 'Medicine',
    icon: 'medical-outline',
    color: '#2196F3',
    description: 'Medications and supplements'
  },
  {
    id: 'appointment',
    title: 'Appointment',
    icon: 'calendar-outline',
    color: '#9C27B0',
    description: 'General appointments and meetings'
  },
  {
    id: 'meal',
    title: 'Meal Planning',
    icon: 'restaurant-outline',
    color: '#FF9800',
    description: 'Meals, diet, and nutrition'
  },
  {
    id: 'therapy',
    title: 'Therapy',
    icon: 'heart-outline',
    color: '#E91E63',
    description: 'Mental health and therapy sessions'
  },
  {
    id: 'lab',
    title: 'Lab Test',
    icon: 'flask-outline',
    color: '#00BCD4',
    description: 'Laboratory tests and diagnostics'
  },
  {
    id: 'other',
    title: 'Other',
    icon: 'ellipsis-horizontal-outline',
    color: '#607D8B',
    description: 'Other health-related tasks'
  }
];

const CalendarScreen: React.FC<CalendarScreenProps> = ({ route }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<{ [date: string]: Event[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tempTimeSlot, setTempTimeSlot] = useState<string | null>(null);

  const navigation = useNavigation();

  // Get Firestore instance directly
  const firestore = getFirestore(app);

  // Generate time slots from 9am to 5pm with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      // Format time with leading zeros and consistent AM/PM format
      const timeString = `${formattedHour.toString().padStart(2, '0')}:00 ${ampm}`;
      slots.push(timeString);
      if (hour !== 17) {
        slots.push(`${formattedHour.toString().padStart(2, '0')}:30 ${ampm}`);
      }
    }
    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  // Handle edit mode from route params
  useEffect(() => {
    if (route?.params?.editMode && route?.params?.eventToEdit) {
      const event = route.params.eventToEdit;
      setSelectedDate(event.date);
      setEventTitle(event.title);
      setEventDescription(event.description);
      setSelectedTimeSlot(event.timeSlot || null);
      setIsEditMode(true);
      setEditingEvent(event);
      setModalVisible(true);
    }
  }, [route?.params]);

  // Handle selected doctor from route params
  useEffect(() => {
    if (route?.params?.selectedDoctor) {
      setSelectedDoctor(route.params.selectedDoctor);
      // If a doctor is selected, open the time slots modal
      setShowTimeSlots(true);
    }
  }, [route?.params]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(firestore, 'events');
      const q = query(
        eventsRef, 
        where('userId', '==', currentUser?.uid),
        where('category', '==', 'events') // Only fetch regular calendar events
      );
      const snapshot = await getDocs(q);

      const fetchedEvents: { [date: string]: Event[] } = {};
      
      // Process each event
      for (const docSnapshot of snapshot.docs) {
        const eventData = docSnapshot.data();
        const eventId = docSnapshot.id;
        
        // Verify the event still exists
        const eventRef = doc(firestore, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const event: Event = {
            id: eventId,
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            userId: eventData.userId,
            timeSlot: eventData.timeSlot,
            doctorId: eventData.doctorId,
            doctorName: eventData.doctorName,
            doctorSpecialty: eventData.doctorSpecialty,
            doctorHospital: eventData.doctorHospital,
            doctorNPI: eventData.doctorNPI
          };
          
          // Group events by date
          if (!fetchedEvents[event.date]) {
            fetchedEvents[event.date] = [];
          }
          fetchedEvents[event.date].push(event);
        }
      }

      console.log('Fetched calendar events:', fetchedEvents);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    }
  };

  const handleDayPress = async (day: { dateString: string }) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
    
    // Fetch fresh events for the selected date
    try {
      const eventsRef = collection(firestore, 'events');
      const q = query(
        eventsRef,
        where('userId', '==', currentUser?.uid),
        where('date', '==', day.dateString)
      );
      const snapshot = await getDocs(q);
      
      const validEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setSelectedEvents(validEvents);
    } catch (error) {
      console.error('Error fetching events for day:', error);
      setSelectedEvents([]);
    }
    
    // Show the time slots modal
    setShowTimeSlots(true);
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      // Ensure the date string is in YYYY-MM-DD format
      if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return 'Invalid Date';
      }
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleTimeSlotSelect = async (timeSlot: string) => {
    setTempTimeSlot(timeSlot);
    setShowCategoryModal(true);
    setShowTimeSlots(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = TASK_CATEGORIES.find(cat => cat.id === categoryId);
    if (category && tempTimeSlot) {
      handleAddEvent(tempTimeSlot, category);
    }
    setShowCategoryModal(false);
  };

  const handleAddEvent = async (timeSlot: string, category: typeof TASK_CATEGORIES[0]) => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to add events');
        return;
      }

      if (!timeSlot) {
        Alert.alert('Error', 'Please select a time slot');
        return;
      }

      const formattedTimeSlot = timeSlot.replace(/^(\d):/, '0$1:');
      const eventData: Partial<Event> = {
        title: `${category.title} at ${formattedTimeSlot}`,
        description: eventDescription || `Scheduled for ${formatDateForDisplay(selectedDate)}`,
        date: selectedDate,
        timeSlot: formattedTimeSlot,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        type: 'calendar_event',
        // Only set category as upcoming_appointments if it's a doctor appointment
        category: (category.id === 'appointment' && selectedDoctor) ? 'upcoming_appointments' : 'events',
        taskType: category.id,
        taskCategory: category.title,
        status: 'pending'
      };

      // If this is a doctor appointment and we have selected doctor info
      if (category.id === 'appointment' && selectedDoctor) {
        eventData.doctorId = selectedDoctor.id;
        eventData.doctorName = selectedDoctor.name;
        eventData.doctorSpecialty = selectedDoctor.specialty;
        eventData.doctorHospital = selectedDoctor.hospital;
        eventData.doctorNPI = selectedDoctor.npi;
      }

      const eventsRef = collection(firestore, 'events');
      await addDoc(eventsRef, eventData);
      
      setModalVisible(false);
      setShowTimeSlots(false);
      setSelectedTimeSlot(null);
      setSelectedDoctor(null);
      setEventTitle('');
      setEventDescription('');
      setSelectedCategory(null);
      setTempTimeSlot(null);
      
      await fetchEvents();
      
      const successMessage = category.id === 'appointment' 
        ? (selectedDoctor ? 'Doctor appointment' : 'Appointment task')
        : `${category.title} task`;
      Alert.alert('Success', `${successMessage} added successfully`);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to schedule task. Please try again.');
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark dates with events
    Object.keys(events).forEach((date) => {
      if (events[date] && events[date].length > 0) {
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: events[date].length > 1 ? '#E8F5E9' : '#F5F5F5',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#50cebb'
            },
            text: {
              color: '#333333',
              fontWeight: 'bold'
            }
          }
        };
      }
    });

    // Add selected date marking
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#0066FF',
        selectedTextColor: '#FFFFFF'
      };
    }

    return marked;
  };

  // Update the modal title to show when scheduling with a doctor
  const getModalTitle = () => {
    if (selectedDoctor) {
      return `Schedule with ${selectedDoctor.name}`;
    }
    return isEditMode ? 'Edit Event' : `Add Event for ${selectedDate}`;
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!eventId) {
      console.error('No event ID provided');
      return;
    }

    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete the appointment "${eventTitle}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const eventRef = doc(firestore, 'events', eventId);
              await deleteDoc(eventRef);
              console.log('Successfully deleted from Firestore');

              setEvents(prevEvents => {
                const newEvents = { ...prevEvents };
                Object.keys(newEvents).forEach(date => {
                  newEvents[date] = newEvents[date].filter(event => event.id !== eventId);
                  if (newEvents[date].length === 0) {
                    delete newEvents[date];
                  }
                });
                return newEvents;
              });

              setSelectedEvents(prev => prev.filter(event => event.id !== eventId));
              setModalVisible(false);
              
              Alert.alert('Success', 'Appointment deleted successfully');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete appointment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getEventColor = (taskType: string): string => {
    const colorMap: { [key: string]: string } = {
      medicine: '#2196F3',
      appointment: '#9C27B0',
      therapy: '#E91E63',
      lab: '#00BCD4',
      exercise: '#4CAF50',
      meal: '#FF9800',
      other: '#607D8B'
    };
    return colorMap[taskType] || '#607D8B';
  };

  const renderEventItem = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.appointmentTime}>{event.timeSlot}</Text>
        <View style={[styles.timeIndicator, { backgroundColor: getEventColor(event.taskType || '') }]} />
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            {event.taskType === 'medicine' && (
              <Icon name="medical-outline" size={20} color="#2196F3" style={styles.eventIcon} />
            )}
            {event.taskType === 'appointment' && (
              <Icon name="calendar-outline" size={20} color="#9C27B0" style={styles.eventIcon} />
            )}
            {event.taskType === 'therapy' && (
              <Icon name="heart-outline" size={20} color="#E91E63" style={styles.eventIcon} />
            )}
            {event.taskType === 'lab' && (
              <Icon name="flask-outline" size={20} color="#00BCD4" style={styles.eventIcon} />
            )}
            {event.taskType === 'exercise' && (
              <Icon name="fitness-outline" size={20} color="#4CAF50" style={styles.eventIcon} />
            )}
            {event.taskType === 'meal' && (
              <Icon name="restaurant-outline" size={20} color="#FF9800" style={styles.eventIcon} />
            )}
            {event.taskType === 'other' && (
              <Icon name="ellipsis-horizontal-outline" size={20} color="#607D8B" style={styles.eventIcon} />
            )}
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity
              onPress={() => handleDeleteEvent(event.id, event.title)}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Icon name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.eventDescription}>{event.description}</Text>
        <View style={styles.eventMetadata}>
          <View style={styles.metadataItem}>
            <Icon name="time-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>{event.timeSlot}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Icon name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>
              {format(new Date(event.date + 'T00:00:00'), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule Tasks</Text>
        </View>

        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          markingType="custom"
          theme={{
            todayTextColor: '#0066FF',
            selectedDayBackgroundColor: '#0066FF',
            selectedDayTextColor: '#FFFFFF',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.header': {
              dayTextAtIndex0: {
                color: '#ff6b6b'
              },
              dayTextAtIndex6: {
                color: '#ff6b6b'
              }
            }
          }}
        />

        {/* Event Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Appointments for {formatDateForDisplay(selectedDate)}</Text>
                  <ScrollView style={styles.eventsContainer}>
                    {selectedEvents.map(renderEventItem)}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Time Slots Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTimeSlots}
          onRequestClose={() => setShowTimeSlots(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowTimeSlots(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  {selectedDoctor && (
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{selectedDoctor.name}</Text>
                      <Text style={styles.doctorSpecialty}>
                        {selectedDoctor.specialty}
                        {selectedDoctor.subSpecialty ? ` (${selectedDoctor.subSpecialty})` : ''}
                      </Text>
                      {selectedDoctor.hospital && (
                        <Text style={styles.doctorHospital}>
                          <Icon name="business-outline" size={14} color="#7f8c8d" /> {selectedDoctor.hospital}
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={styles.modalSubtitle}>
                    {selectedDate ? formatDateForDisplay(selectedDate) : 'Select a date'}
                  </Text>
                  <ScrollView style={styles.timeSlotsContainer}>
                    {timeSlots.map((slot, index) => {
                      const formattedSlot = slot.replace(/^(\d):/, '0$1:');
                      const isSlotTaken = selectedEvents.some(event => event.timeSlot === formattedSlot);
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.timeSlotItem,
                            selectedTimeSlot === formattedSlot && styles.selectedTimeSlot,
                            isSlotTaken && styles.takenTimeSlot
                          ]}
                          onPress={() => {
                            if (!isSlotTaken) {
                              handleTimeSlotSelect(formattedSlot);
                            }
                          }}
                          disabled={isSlotTaken}
                        >
                          <Text style={[
                            styles.timeSlotText,
                            selectedTimeSlot === formattedSlot && styles.selectedTimeSlotText,
                            isSlotTaken && styles.takenTimeSlotText
                          ]}>
                            {formattedSlot}
                          </Text>
                          {isSlotTaken && (
                            <Text style={styles.takenSlotIndicator}>Taken</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowTimeSlots(false)}
                  >
                    <Text style={styles.closeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.categoryModal}>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Select Task Type</Text>
              <ScrollView>
                <View style={styles.categoryGrid}>
                  {TASK_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.selectedCategoryItem
                      ]}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        handleAddEvent(selectedTimeSlot || 'All Day', category);
                      }}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Icon name={category.icon} size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.categoryItemTitle}>{category.title}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    if (selectedCategory && tempTimeSlot) {
                      const category = TASK_CATEGORIES.find(cat => cat.id === selectedCategory);
                      if (category) {
                        handleAddEvent(tempTimeSlot, category);
                      }
                    }
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  timeSlotsContainer: {
    marginVertical: 10,
  },
  timeSlotItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedTimeSlot: {
    backgroundColor: '#50cebb',
    borderColor: '#50cebb',
  },
  timeSlotText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsContainer: {
    flex: 1,
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
    borderRadius: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#50cebb',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#50cebb',
    fontWeight: '500',
  },
  timeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  eventDetails: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#50cebb',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  doctorInfo: {
    backgroundColor: '#f0f5ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  doctorHospital: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  timeSlotLabel: {
    fontSize: 16,
    color: '#50cebb',
    marginBottom: 15,
    fontWeight: '500',
  },
  takenTimeSlot: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    opacity: 0.7,
  },
  takenTimeSlotText: {
    color: '#721c24',
  },
  takenSlotIndicator: {
    fontSize: 12,
    color: '#721c24',
    marginLeft: 8,
  },
  categoryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  categoryContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryItem: {
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CalendarScreen;