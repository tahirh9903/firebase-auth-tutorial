import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { User } from '@firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import auth from '@react-native-firebase/auth';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  userId: string;
  category: string;
  createdAt?: any; // Firebase Timestamp
}

interface EventsByDate {
  [date: string]: Event[];
}

interface HomeScreenProps {
  user: User | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [userData, setUserData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [imageError, setImageError] = useState(false);
  const [events, setEvents] = useState<EventsByDate>({});
  const [upcomingAppointments, setUpcomingAppointments] = useState<Event[]>([]);

  const fetchEvents = async () => {
    try {
      if (!user) return;

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef, 
        where('userId', '==', user.uid),
        where('category', '==', 'events')
      );
      
      const querySnapshot = await getDocs(q);
      
      const fetchedEvents: EventsByDate = {};
      querySnapshot.forEach((doc) => {
        const event = { id: doc.id, ...doc.data() } as Event;
        if (event.category === 'events') {
          if (!fetchedEvents[event.date]) {
            fetchedEvents[event.date] = [];
          }
          fetchedEvents[event.date].push(event);
        }
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
      });

      // Convert Map values to array and sort
      const sortedAppointments = Array.from(uniqueAppointments.values())
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        })
        .slice(0, 5);

      setUpcomingAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
      fetchUpcomingAppointments();
    }, [user?.uid, selectedDate])
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('HomeScreen - User Data:', data);
            console.log('HomeScreen - Photo URL:', data.photoURL);
            setUserData(data);
            setImageError(false);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setImageError(true);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const generateWeekDays = () => {
    const days = [];
    const currentDate = new Date();
    const firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const hasEvents = events[formattedDate]?.some(event => event.category === 'events');
      days.push({
        date: formattedDate,
        dayName: format(date, 'EEE').toUpperCase(),
        dayNumber: date.getDate(),
        hasEvents: hasEvents,
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

  const renderEvent = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.appointmentTime}>{event.timeSlot}</Text>
        <View style={[styles.timeIndicator, { backgroundColor: getEventColor(event.title) }]} />
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteEvent(event.id, event.title, event.category)}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={20} color="#ff6b6b" />
          </TouchableOpacity>
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
              {format(new Date(event.date + 'T00:00:00'), 'MMM d, yyyy')}
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

  const getEventsForDate = (date: string) => {
    // Get regular events for this date
    const regularEvents = events[date] || [];
    
    // Get appointments for this date
    const appointmentsForDate = upcomingAppointments.filter(
      appointment => appointment.date === date
    );

    // Return only regular events, appointments will be shown in the Upcoming Appointments section
    return regularEvents;
  };

  // Add this effect to update events when selected date changes
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.userInfoContainer}>
              <View style={[styles.profileImageContainer, imageError && styles.defaultProfileImage]}>
                <Image
                  source={{ 
                    uri: userData?.photoURL
                  }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.log('HomeScreen - Image loading error:', e.nativeEvent.error);
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log('HomeScreen - Image loaded successfully');
                    setImageError(false);
                  }}
                />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.greeting}>Hi, Welcome Back</Text>
                <Text style={styles.userName}>{userData?.fullName || 'Guest'}</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Profile', {
                  screen: 'Settings',
                  params: { initialTab: 'notifications' }
                })}
              >
                <Icon name="notifications-none" size={24} color="#0066FF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Icon name="medical-services" size={20} color="#0066FF" />
              <Text style={styles.actionText}>My Doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Doctors')}
            >
              <Icon name="search" size={20} color="#0066FF" />
              <Text style={styles.actionText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          >
            {generateWeekDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  day.date === selectedDate && styles.selectedDay,
                ]}
                onPress={() => {
                  setSelectedDate(day.date);
                  // Fetch events immediately when date is selected
                  fetchEvents();
                }}
              >
                <View style={styles.dayContent}>
                  <Text style={[
                    styles.dayNumber,
                    day.date === selectedDate && styles.selectedDayText,
                  ]}>
                    {day.dayNumber}
                  </Text>
                  <Text style={[
                    styles.dayName,
                    day.date === selectedDate && styles.selectedDayText,
                  ]}>
                    {day.dayName}
                  </Text>
                  {day.hasEvents && (
                    <View style={[
                      styles.dot,
                      day.date === selectedDate && styles.selectedDot
                    ]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.appointments}>
          <View style={styles.sectionHeader}>
            <Icon name="event" size={24} color="#333" />
            <Text style={styles.sectionTitle}>
              Events for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
            </Text>
          </View>
          {events[selectedDate]?.filter(event => event.category === 'events').length > 0 ? (
            events[selectedDate]
              .filter(event => event.category === 'events')
              .map(renderEvent)
          ) : (
            <Text style={styles.noEventsText}>No events scheduled for today</Text>
          )}
        </View>

        <View style={styles.upcomingAppointments}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar-today" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Appointments for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}</Text>
          </View>
          {upcomingAppointments.filter(apt => apt.date === selectedDate).length === 0 ? (
            <View style={styles.noAppointmentsContainer}>
              <Icon name="event-busy" size={40} color="#666" />
              <Text style={styles.noAppointmentsText}>No appointments for this date</Text>
            </View>
          ) : (
            upcomingAppointments
              .filter(apt => apt.date === selectedDate)
              .map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentDateStrip}>
                    <Text style={styles.appointmentTime}>
                      {appointment.timeSlot}
                    </Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEvent(appointment.id, appointment.title, appointment.category)}
                        style={styles.deleteButton}
                      >
                        <Icon name="delete" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.appointmentSpecialty}>{appointment.description}</Text>
                    {appointment.timeSlot && (
                      <Text style={styles.appointmentLocation}>
                        <Icon name="schedule" size={14} color="#666" /> {appointment.timeSlot}
                      </Text>
                    )}
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  defaultProfileImage: {
    backgroundColor: '#E1E1E1',
  },
  userTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    backgroundColor: '#f0f5ff',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#f0f5ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    marginHorizontal: 6,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  calendar: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  calendarContent: {
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
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
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
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
});

export default HomeScreen;