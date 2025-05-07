import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, Modal, TextInput } from 'react-native';
import { User } from '@firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { getAuth } from '@firebase/auth';
import HealthTipsModal from '../components/HealthTipsModal';
import { useAccessibility } from '../context/AccessibilityContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  userId: string;
  category: string;
  createdAt?: any; // Firebase Timestamp
  status?: string;
  taskType?: string;
  doctorId?: string;
}

interface EventsByDate {
  [date: string]: Event[];
}

interface PrescriptionRequest {
  id: string;
  type: 'new' | 'transfer' | 'refill';
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  medicationName: string;
  strength?: string;
  pharmacy: string;
  requestDate: string;
  userId: string;
  description?: string;
  removedAt?: string;
}

interface HomeScreenProps {
  user: User | null;
}

interface UserData {
  displayName?: string;
  photoURL?: string;
  [key: string]: any;
}

const moods = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '🤒', label: 'Sick', value: 'sick' },
];

const symptoms = [
  { emoji: '🤕', label: 'Headache', value: 'headache' },
  { emoji: '🤢', label: 'Nausea', value: 'nausea' },
  { emoji: '😫', label: 'Pain', value: 'pain' },
  { emoji: '😰', label: 'Anxiety', value: 'anxiety' },
  { emoji: '😪', label: 'Drowsy', value: 'drowsy' },
  { emoji: '🤧', label: 'Cold', value: 'cold' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ user }) => {
  const { isDarkMode, textSize } = useAccessibility();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const calendarScrollRef = useRef<ScrollView>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [imageError, setImageError] = useState(false);
  const [events, setEvents] = useState<EventsByDate>({});
  const [upcomingAppointments, setUpcomingAppointments] = useState<Event[]>([]);
  const [prescriptionRequests, setPrescriptionRequests] = useState<PrescriptionRequest[]>([]);
  const [showHealthTips, setShowHealthTips] = useState(false);
  const auth = getAuth();

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#FFFFFF';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#F8F8F8';
  const borderColor = isDarkMode ? '#444444' : '#E9ECEF';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#FFFFFF';
  const calendarBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const calendarTextColor = isDarkMode ? '#fff' : '#333';
  const calendarBorderColor = isDarkMode ? '#444444' : '#f0f0f0';
  const eventCardBackgroundColor = isDarkMode ? '#2a2a2a' : '#ffffff';
  const eventCardBorderColor = isDarkMode ? '#444444' : '#f0f0f0';
  const appointmentCardBackgroundColor = isDarkMode ? '#1a1a1a' : '#F0F5FF';
  const noEventsBackgroundColor = isDarkMode ? '#2a2a2a' : '#f8f9fa';
  const noEventsTextColor = isDarkMode ? '#ccc' : '#666';

  const fetchEvents = async () => {
    try {
      if (!user) return;

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef, 
        where('userId', '==', user.uid),
        where('category', 'in', ['events', 'upcoming_appointments'])
      );
      
      const querySnapshot = await getDocs(q);
      
      const fetchedEvents: EventsByDate = {};
      querySnapshot.forEach((doc) => {
        const event = { id: doc.id, ...doc.data() } as Event;
        if (!fetchedEvents[event.date]) {
          fetchedEvents[event.date] = [];
        }
        fetchedEvents[event.date].push(event);
      });
      
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchUpcomingAppointments = async () => {
    if (!user) return;

    try {
      const eventsRef = collection(db, 'events');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = format(today, 'yyyy-MM-dd');
      
      const q = query(
        eventsRef,
        where('userId', '==', user.uid),
        where('category', '==', 'upcoming_appointments')
      );

      const snapshot = await getDocs(q);
      
      // Create a Map to store unique appointments by their date and time
      const uniqueAppointments = new Map();
      
      snapshot.docs.forEach(doc => {
        const appointment = { id: doc.id, ...doc.data() } as Event;
        // Only process appointments that have a doctorId
        if (appointment.doctorId) {
          // Create a unique key using date and timeSlot
          const key = `${appointment.date}-${appointment.timeSlot}`;
          
          // Only add if it's a future appointment
          if (appointment.date >= todayStr) {
            // If there's already an appointment at this date and time,
            // keep the one with the most recent creation time (if available)
            const existing = uniqueAppointments.get(key);
            if (!existing || (appointment.createdAt && existing.createdAt && 
                appointment.createdAt > existing.createdAt)) {
              uniqueAppointments.set(key, appointment);
            }
          }
        }
      });

      // Convert Map values to array and sort
      const sortedAppointments = Array.from(uniqueAppointments.values())
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        });

      setUpcomingAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  };

  const fetchPrescriptionRequests = async () => {
    if (!user) return;

    try {
      const requestsRef = collection(db, 'prescriptionRequests');
      const q = query(
        requestsRef,
        where('userId', '==', user.uid),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const requests: PrescriptionRequest[] = [];
      
      snapshot.docs.forEach(doc => {
        requests.push({ id: doc.id, ...doc.data() } as PrescriptionRequest);
      });

      // Sort the requests in memory instead
      requests.sort((a, b) => 
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );

      setPrescriptionRequests(requests);
    } catch (error) {
      console.error('Error fetching prescription requests:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
      fetchUpcomingAppointments();
      fetchPrescriptionRequests();
    }, [user?.uid, selectedDate])
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          // Get the current user's display name directly from auth
          const currentUser = auth.currentUser;
          console.log('Current User:', currentUser);
          console.log('Display Name:', currentUser?.displayName);
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('HomeScreen - User Data:', data);
            console.log('HomeScreen - Photo URL:', data.photoURL);
            // Merge the auth display name with Firestore data
            setUserData({
              ...data,
              displayName: currentUser?.displayName || data.displayName || 'User'
            });
            setImageError(false);
          } else {
            // If no Firestore doc exists, still set the display name from auth
            setUserData({
              displayName: currentUser?.displayName || 'User'
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setImageError(true);
        }
      }
    };

    fetchUserProfile();

    // Add auth state listener to update when user data changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        console.log('Auth State Changed - Display Name:', currentUser.displayName);
        setUserData((prevData: UserData | null) => ({
          ...prevData,
          displayName: currentUser.displayName || 'User'
        }));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const generateWeekDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const today = format(new Date(), 'yyyy-MM-dd');

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(firstDayOfMonth);
      date.setDate(firstDayOfMonth.getDate() + i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const hasEvents = events[formattedDate]?.some(event => 
        event.category === 'events' || 
        (event.taskType === 'appointment' && !event.doctorId)
      );
      const isToday = formattedDate === today;
      days.push({
        date: formattedDate,
        dayName: format(date, 'EEE').toUpperCase(),
        dayNumber: date.getDate(),
        hasEvents: hasEvents,
        isToday: isToday,
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  const handleDeleteEvent = (eventId: string, eventTitle: string, category?: string) => {
    const itemType = category === 'upcoming_appointments' ? 'appointment' : 'task';
    Alert.alert(
      `Delete ${itemType}`,
      `Are you sure you want to delete "${eventTitle}"?`,
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
              await deleteDoc(doc(db, 'events', eventId));
              
              // Refresh the appropriate list based on the category
              if (category === 'upcoming_appointments') {
                fetchUpcomingAppointments();
              } else {
                fetchEvents();
              }
              
              Alert.alert('Success', `${itemType} deleted successfully`);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', `Failed to delete ${itemType}. Please try again.`);
            }
          }
        }
      ]
    );
  };

  const handleRemovePrescriptionRequest = async (requestId: string, title: string) => {
    Alert.alert(
      'Remove Request',
      'Are you sure you want to remove this prescription request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestRef = doc(db, 'prescriptionRequests', requestId);
              await updateDoc(requestRef, {
                status: 'removed',
                removedAt: new Date().toISOString()
              });
              
              // Refresh the prescription requests
              fetchPrescriptionRequests();
              Alert.alert('Success', 'Request removed successfully');
            } catch (error) {
              console.error('Error removing prescription request:', error);
              Alert.alert('Error', 'Failed to remove request. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getEventsForDate = (date: string) => {
    if (!date) return [];
    return events[date] || [];
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      // Ensure the date string is in YYYY-MM-DD format
      if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return format(new Date(), 'MMMM d, yyyy');
      }
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(date.getTime())) {
        return format(new Date(), 'MMMM d, yyyy');
      }
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return format(new Date(), 'MMMM d, yyyy');
    }
  };

  const renderEvent = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.appointmentTime}>{event.timeSlot}</Text>
        <View style={[styles.timeIndicator, { 
          backgroundColor: event.category === 'prescription_request' ? '#0066FF' : getEventColor(event.title)
        }]} />
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            <Icon 
              name={event.category === 'prescription_request' ? 'medical-services' : 'event'} 
              size={20} 
              color={event.category === 'prescription_request' ? '#0066FF' : '#333'} 
              style={styles.eventIcon} 
            />
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
          <View style={styles.eventActions}>
            {event.category === 'prescription_request' ? (
              <TouchableOpacity
                onPress={() => handleRemovePrescriptionRequest(event.id, event.title)}
                style={[styles.actionButton, styles.removeButton]}
              >
                <Icon name="remove-circle-outline" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleDeleteEvent(event.id, event.title, event.category)}
                style={styles.deleteButton}
              >
                <Icon name="delete" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.eventDescription}>{event.description}</Text>
        <View style={styles.eventMetadata}>
          <View style={styles.metadataItem}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.metadataText}>{event.timeSlot}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Icon name="event" size={16} color="#666" />
            <Text style={styles.metadataText}>
              {formatDateForDisplay(event.date)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getEventColor = (title: string): string => {
    // Generate a consistent color based on the event title
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Add this effect to update events when selected date changes
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'new':
        return 'add-circle-outline';
      case 'transfer':
        return 'swap-horiz';
      case 'refill':
        return 'refresh';
      default:
        return 'medical-services';
    }
  };

  const renderPrescriptionRequest = (request: PrescriptionRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTypeContainer}>
          <Icon name={getRequestTypeIcon(request.type)} size={24} color="#0066FF" />
          <Text style={styles.requestType}>
            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Prescription
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemovePrescriptionRequest(request.id, request.medicationName)}
          style={[styles.actionButton, styles.removeButton]}
        >
          <Icon name="remove-circle-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.medicationName}>{request.medicationName}</Text>
        {request.strength && (
          <Text style={styles.medicationStrength}>{request.strength}</Text>
        )}
        <Text style={styles.pharmacyName}>Pharmacy: {request.pharmacy}</Text>
        {request.description && (
          <Text style={styles.requestDescription}>{request.description}</Text>
        )}
        <Text style={styles.requestDate}>
          Requested on {format(new Date(request.requestDate), 'MMM d, yyyy')}
        </Text>
      </View>
    </View>
  );

  const scrollToToday = (dayIndex: number) => {
    if (calendarScrollRef.current) {
      // Calculate scroll position based on item width (65 is minWidth from styles) plus margin (8)
      const itemWidth = 73; // 65 + 8
      const scrollPosition = dayIndex * itemWidth;
      calendarScrollRef.current.scrollTo({ x: scrollPosition, animated: true });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: headerBackgroundColor, borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <Image
            source={
              user?.photoURL
                ? { uri: user.photoURL }
                : require('../../assets/images/default-avatar.png')
            }
            style={styles.profileImage}
            onError={() => setImageError(true)}
          />
          <View>
            <Text style={[styles.greeting, { color: secondaryTextColor }]}>Hello,</Text>
            <Text style={[styles.userName, { color: textColor }]}>{user?.displayName || 'User'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}
            onPress={() => setShowHealthTips(true)}
          >
            <Icon name="favorite" size={24} color={isDarkMode ? '#fff' : '#002B5B'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.calendar, { backgroundColor: calendarBackgroundColor }]}>
          <View style={[styles.monthHeader, { borderBottomColor: calendarBorderColor }]}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={[styles.monthNavigationButton, { backgroundColor: isDarkMode ? '#333' : '#f8f9fa' }]}
            >
              <Icon name="chevron-left" size={24} color={calendarTextColor} />
            </TouchableOpacity>
            <View style={styles.monthTitleContainer}>
              <Text style={[styles.monthTitle, { color: calendarTextColor }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  const formattedToday = format(today, 'yyyy-MM-dd');
                  setCurrentMonth(today);
                  setSelectedDate(formattedToday);
                  const dayIndex = today.getDate() - 1;
                  scrollToToday(dayIndex);
                }}
              >
                <Icon name="today" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={goToNextMonth}
              style={[styles.monthNavigationButton, { backgroundColor: isDarkMode ? '#333' : '#f8f9fa' }]}
            >
              <Icon name="chevron-right" size={24} color={calendarTextColor} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            ref={calendarScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          >
            {generateWeekDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  { backgroundColor: isDarkMode ? '#333' : '#f8f9fa' },
                  day.date === selectedDate && styles.selectedDay,
                  day.isToday && day.date === selectedDate && styles.todaySelected,
                  day.isToday && !selectedDate && styles.todayItem,
                ]}
                onPress={() => setSelectedDate(day.date === selectedDate ? '' : day.date)}
              >
                <View style={styles.dayContent}>
                  <Text style={[
                    styles.dayNumber,
                    { color: calendarTextColor },
                    day.date === selectedDate && styles.selectedDayText,
                    day.isToday && day.date === selectedDate && styles.todaySelectedText,
                    day.isToday && !selectedDate && styles.todayText,
                  ]}>
                    {day.dayNumber}
                  </Text>
                  <Text style={[
                    styles.dayName,
                    { color: secondaryTextColor },
                    day.date === selectedDate && styles.selectedDayText,
                    day.isToday && day.date === selectedDate && styles.todaySelectedText,
                    day.isToday && !selectedDate && styles.todayText,
                  ]}>
                    {day.dayName}
                  </Text>
                  {day.hasEvents && (
                    <View style={[
                      styles.dot,
                      day.date === selectedDate && styles.selectedDot,
                      day.isToday && day.date === selectedDate && styles.todaySelectedDot,
                      day.isToday && !selectedDate && styles.todayDot,
                    ]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.appointments}>
          <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
            <Icon name="event" size={24} color={calendarTextColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Events for {formatDateForDisplay(selectedDate)}
            </Text>
          </View>
          {getEventsForDate(selectedDate).length > 0 ? (
            getEventsForDate(selectedDate).map(renderEvent)
          ) : (
            <Text style={[styles.noEventsText, { 
              backgroundColor: noEventsBackgroundColor,
              color: noEventsTextColor 
            }]}>No events scheduled for today</Text>
          )}
        </View>

        {/* Prescription Requests Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
            <Icon name="medical-services" size={24} color="#0066FF" />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Ongoing Prescription Requests</Text>
          </View>
          <View style={styles.requestsContainer}>
            {prescriptionRequests.length > 0 ? (
              prescriptionRequests.map(renderPrescriptionRequest)
            ) : (
              <View style={[styles.noRequestsContainer, { backgroundColor: noEventsBackgroundColor }]}>
                <Icon name="medication" size={40} color={secondaryTextColor} />
                <Text style={[styles.noRequestsText, { color: noEventsTextColor }]}>No ongoing prescription requests</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.upcomingAppointments}>
          <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
            <Icon name="calendar-today" size={24} color={calendarTextColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Appointments for {formatDateForDisplay(selectedDate)}</Text>
          </View>
          {upcomingAppointments.filter(apt => apt.date === selectedDate).length === 0 ? (
            <View style={[styles.noAppointmentsContainer, { backgroundColor: noEventsBackgroundColor }]}>
              <Icon name="event-busy" size={40} color={secondaryTextColor} />
              <Text style={[styles.noAppointmentsText, { color: noEventsTextColor }]}>No appointments for this date</Text>
            </View>
          ) : (
            upcomingAppointments
              .filter(apt => apt.date === selectedDate)
              .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))
              .map((appointment) => (
                <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: appointmentCardBackgroundColor }]}>
                  <View style={styles.appointmentDateStrip}>
                    <Text style={styles.appointmentTime}>
                      {appointment.timeSlot}
                    </Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.appointmentHeader}>
                      <Text style={[styles.appointmentTitle, { color: textColor }]}>{appointment.title}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEvent(appointment.id, appointment.title, appointment.category)}
                        style={styles.deleteButton}
                      >
                        <Icon name="delete" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.appointmentSpecialty, { color: '#0066FF' }]}>{appointment.description}</Text>
                    {appointment.timeSlot && (
                      <Text style={[styles.appointmentLocation, { color: secondaryTextColor }]}>
                        <Icon name="schedule" size={14} color={secondaryTextColor} /> {appointment.timeSlot}
                      </Text>
                    )}
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>

      <HealthTipsModal 
        visible={showHealthTips}
        onClose={() => setShowHealthTips(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002B5B',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF9800',
  },
  calendar: {
    marginBottom: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  monthHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  monthNavigationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  todayButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 65,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  todayItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  todaySelected: {
    backgroundColor: '#007AFF',
    borderColor: '#2196F3',
    borderWidth: 2.5,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  todaySelectedText: {
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  todaySelectedDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  dayName: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  todayText: {
    color: '#2196F3',
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  selectedDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayDot: {
    backgroundColor: '#2196F3',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appointments: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  timeIndicator: {
    width: 3,
    height: 45,
    backgroundColor: '#007AFF',
    marginTop: 8,
    borderRadius: 1.5,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  eventDetails: {
    flex: 1,
    paddingVertical: 4,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
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
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  upcomingAppointments: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  appointmentDateStrip: {
    backgroundColor: '#0066FF',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  appointmentDate: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#0066FF',
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#666',
  },
  appointmentDetails: {
    flex: 1,
    padding: 12,
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  requestsContainer: {
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: '#FF9800',
  },
  requestDetails: {
    marginTop: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  medicationStrength: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  requestDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noRequestsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 8,
  },
  noRequestsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default HomeScreen;