import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  hospital?: string;
  address: string;
  phoneNumber?: string;
  npi: string;
}

const specialties = [
  'Primary Care',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology'
];

// Mapping of specialties to taxonomy codes used by NPI Registry
const specialtyToTaxonomy: { [key: string]: string } = {
  'Primary Care': '208D00000X',
  'Cardiology': '207RC0000X',
  'Dermatology': '207N00000X',
  'Endocrinology': '207RE0101X',
  'Gastroenterology': '207RG0100X',
  'Neurology': '2084N0400X',
  'Obstetrics & Gynecology': '207V00000X',
  'Oncology': '207RX0202X',
  'Ophthalmology': '207W00000X',
  'Orthopedics': '207X00000X',
  'Pediatrics': '208000000X',
  'Psychiatry': '2084P0800X',
  'Pulmonology': '207RP1001X',
  'Rheumatology': '207RR0500X',
  'Urology': '208800000X'
};

const DoctorsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [zipCode, setZipCode] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const bottomSheetRef = useRef<any>(null);
  const auth = getAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedDoctorForContact, setSelectedDoctorForContact] = useState<Doctor | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const searchDoctors = async () => {
    if (zipCode.length !== 5) {
      setDoctors([]); // Clear results if zipcode is invalid
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        postal_code: zipCode,
        limit: '50',
        version: '2.1',
      });

      if (selectedSpecialty) {
        params.append('taxonomy_description', selectedSpecialty);
        const taxonomyCode = specialtyToTaxonomy[selectedSpecialty];
        if (taxonomyCode) {
          params.append('taxonomy_code', taxonomyCode);
        }
      }

      const response = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`);
      const data = await response.json();

      if (data.result_count === 0) {
        setDoctors([]);
        return;
      }

      const formattedDoctors: Doctor[] = data.results.map((result: any) => ({
        id: result.number,
        npi: result.number,
        name: result.basic.first_name && result.basic.last_name 
          ? `${result.basic.first_name} ${result.basic.last_name}${result.basic.credential ? ', ' + result.basic.credential : ''}` 
          : 'Name Not Available',
        specialty: result.taxonomies[0]?.desc || 'Not specified',
        subSpecialty: result.taxonomies[1]?.desc,
        hospital: result.addresses[0]?.organization_name,
        address: `${result.addresses[0]?.address_1}, ${result.addresses[0]?.city}, ${result.addresses[0]?.state} ${result.addresses[0]?.postal_code}`,
        phoneNumber: result.addresses[0]?.telephone_number,
      }));

      setDoctors(formattedDoctors);
    } catch (err) {
      setError('Failed to fetch doctors. Please try again.');
      console.error('Error fetching doctors:', err);
      setDoctors([]); // Clear results on error
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (zipCode.length === 5) {
      searchDoctors();
    } else if (zipCode.length === 0) {
      // Clear the results when zipcode is empty
      setDoctors([]);
      setError(null);
    }
  }, [zipCode, selectedSpecialty]);

  const handleDoctorPress = (doctor: Doctor) => {
    navigation.navigate('Calendar', {
      screen: 'Calendar',
      params: {
        selectedDoctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          subSpecialty: doctor.subSpecialty,
          hospital: doctor.hospital,
          npi: doctor.npi
        }
      }
    });
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    if (selectedDoctorForContact?.id) {
      fetchBookedSlots(day.dateString, selectedDoctorForContact.id);
    }
    setSelectedTimeSlot(''); // Reset selected time slot when date changes
  };

  const handleTimeSlotSelect = (slot: string) => {
    setSelectedTimeSlot(slot);
  };

  const handleSchedulePress = (doctor: Doctor) => {
    setSelectedDoctorForContact(doctor);
    setShowScheduleModal(true);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select both date and time');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'Please sign in to schedule appointments');
      return;
    }

    try {
      // Create base appointment data with required fields
      const appointmentData: any = {
        title: `Appointment with ${selectedDoctorForContact?.name}`,
        description: `${selectedDoctorForContact?.specialty} consultation`,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        userId: currentUser.uid,
        doctorId: selectedDoctorForContact?.id,
        doctorName: selectedDoctorForContact?.name,
        doctorSpecialty: selectedDoctorForContact?.specialty,
        createdAt: serverTimestamp(),
        category: 'upcoming_appointments',
        type: 'doctor_appointment'
      };

      // Add optional fields only if they exist
      if (selectedDoctorForContact?.hospital) {
        appointmentData.doctorHospital = selectedDoctorForContact.hospital;
      }
      
      if (selectedDoctorForContact?.npi) {
        appointmentData.doctorNPI = selectedDoctorForContact.npi;
      }

      await addDoc(collection(db, 'events'), appointmentData);
      
      Alert.alert('Success', 'Appointment scheduled successfully');
      setShowScheduleModal(false);
      setSelectedDate('');
      setSelectedTimeSlot('');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      Alert.alert('Error', 'Failed to schedule appointment. Please try again.');
    }
  };

  const fetchBookedSlots = async (selectedDate: string, doctorId: string) => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('date', '==', selectedDate),
        where('doctorId', '==', doctorId),
        where('category', '==', 'upcoming_appointments')
      );
      
      const querySnapshot = await getDocs(q);
      const booked = querySnapshot.docs.map(doc => doc.data().timeSlot);
      setBookedSlots(booked);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    }
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => {
    // Format name and get initials
    const formatName = (name: string, specialty: string) => {
      if (!name || name === 'undefined' || name === 'null') {
        const formattedSpecialty = specialty && specialty !== 'undefined' && specialty !== 'null'
          ? specialty
          : 'General Practice';
        
        // Remove common words to get cleaner specialty name
        const cleanSpecialty = formattedSpecialty
          .replace(/(specialist|doctor|physician|surgeon|practitioner)/gi, '')
          .trim();
          
        return `Dr. ${cleanSpecialty}`;
      }
      return name.split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    };

    const getInitials = (name: string) => {
      if (name === 'Name Not Available') return '?';
    
      if (name.startsWith('Dr.')) {
        const specialty = name.replace('Dr.', '').trim();
        return specialty.slice(0, 2).toUpperCase();
      }
    
      return name.split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    };

    // Format specialty with default
    const formatSpecialty = (specialty: string) => {
      if (!specialty || specialty === 'undefined' || specialty === 'null') {
        return 'General Practice';
      }
      return specialty.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Format address parts
    const formatAddress = (address: string) => {
      if (!address || address.includes('undefined') || address.includes('null')) {
        return 'Address information not available';
      }
      return address.split(',')
        .map(part => part.trim())
        .filter(part => part && !part.includes('undefined') && !part.includes('null'))
        .join(', ');
    };

    // Format phone number
    const formatPhone = (phone: string | undefined) => {
      if (!phone || phone.includes('undefined') || phone.includes('null')) {
        return null;
      }
      return phone.replace(/[^\d]/g, '')
        .replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    };

    const displaySpecialty = formatSpecialty(item.specialty);
    const displayName = formatName(item.name, displaySpecialty);
    const displayAddress = formatAddress(item.address);
    const displayPhone = formatPhone(item.phoneNumber);

    return (
      <TouchableOpacity 
        style={styles.doctorCard}
        onPress={() => handleDoctorPress(item)}
      >
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {getInitials(displayName)}
            </Text>
          </View>
        </View>
        <View style={styles.doctorInfo}>
          <View style={styles.headerContainer}>
            <Text style={styles.doctorName}>{displayName}</Text>
            <Text style={styles.doctorSpecialty}>{displaySpecialty}</Text>
          </View>
          {item.subSpecialty && item.subSpecialty !== 'undefined' && item.subSpecialty !== 'null' && (
            <Text style={styles.doctorSubSpecialty}>{item.subSpecialty}</Text>
          )}
          {item.hospital && item.hospital !== 'undefined' && item.hospital !== 'null' && (
            <Text style={styles.doctorHospital}>
              <Icon name="business" size={14} color="#7f8c8d" /> {item.hospital}
            </Text>
          )}
          <Text style={styles.doctorAddress}>
            <Icon name="location-on" size={14} color="#7f8c8d" /> {displayAddress}
          </Text>
          {displayPhone && (
            <Text style={styles.doctorPhone}>
              <Icon name="phone" size={14} color="#7f8c8d" /> {displayPhone}
            </Text>
          )}
          <Text style={styles.npiNumber}>
            <Icon name="badge" size={14} color="#95a5a6" /> NPI: {item.npi}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={() => handleSchedulePress(item)}
            >
              <Icon name="calendar-today" size={16} color="#FFFFFF" />
              <Text style={styles.scheduleButtonText}> Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {
                setSelectedDoctorForContact(item);
                setShowContactModal(true);
              }}
            >
              <Icon name="phone" size={16} color="#FFFFFF" />
              <Text style={styles.scheduleButtonText}> Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Generate time slots from 9am to 5pm with 30-minute intervals
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const timeString = `${formattedHour.toString().padStart(2, '0')}:00 ${ampm}`;
      if (!bookedSlots.includes(timeString)) {
        slots.push(timeString);
      }
      if (hour !== 17) {
        const halfHourString = `${formattedHour.toString().padStart(2, '0')}:30 ${ampm}`;
        if (!bookedSlots.includes(halfHourString)) {
          slots.push(halfHourString);
        }
      }
    }
    return slots;
  }, [bookedSlots]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Doctors</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <Icon name="location-on" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.specialtiesContainer}
          >
            {specialties.map((specialty) => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.specialtyChip,
                  selectedSpecialty === specialty && styles.selectedSpecialtyChip,
                ]}
                onPress={() => setSelectedSpecialty(specialty === selectedSpecialty ? null : specialty)}
              >
                <Text
                  style={[
                    styles.specialtyText,
                    selectedSpecialty === specialty && styles.selectedSpecialtyText,
                  ]}
                >
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isSearching ? (
          <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
        ) : (
          <FlatList
            data={doctors}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No doctors found in your area.{'\n'}Try a different ZIP code or specialty.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showContactModal}
        onRequestClose={() => setShowContactModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowContactModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Contact Information</Text>
                {selectedDoctorForContact && (
                  <View style={styles.contactInfo}>
                    <Text style={styles.doctorName}>{selectedDoctorForContact.name}</Text>
                    <Text style={styles.doctorSpecialty}>{selectedDoctorForContact.specialty}</Text>
                    {selectedDoctorForContact.hospital && (
                      <Text style={styles.doctorHospital}>
                        <Icon name="business" size={14} color="#7f8c8d" /> {selectedDoctorForContact.hospital}
                      </Text>
                    )}
                    <Text style={styles.doctorAddress}>
                      <Icon name="place" size={14} color="#7f8c8d" /> {selectedDoctorForContact.address}
                    </Text>
                    {selectedDoctorForContact.phoneNumber && (
                      <TouchableOpacity 
                        style={styles.phoneButton}
                        onPress={() => {
                          // You can add phone call functionality here
                          Alert.alert('Contact', `Call ${selectedDoctorForContact.phoneNumber}?`);
                        }}
                      >
                        <Icon name="phone" size={20} color="#FFFFFF" />
                        <Text style={styles.phoneButtonText}>{selectedDoctorForContact.phoneNumber}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowContactModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showScheduleModal}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowScheduleModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Schedule Appointment</Text>
                {selectedDoctorForContact && (
                  <View style={styles.doctorInfoContainer}>
                    <Text style={styles.doctorName}>{selectedDoctorForContact.name}</Text>
                    <Text style={styles.doctorSpecialty}>{selectedDoctorForContact.specialty}</Text>
                    {selectedDoctorForContact.hospital && (
                      <Text style={styles.doctorHospital}>
                        <Icon name="business" size={14} color="#7f8c8d" /> {selectedDoctorForContact.hospital}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.calendarContainer}>
                  <Calendar
                    onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                    markedDates={{
                      [selectedDate]: { selected: true, selectedColor: '#0066FF' }
                    }}
                    minDate={format(new Date(), 'yyyy-MM-dd')}
                    theme={{
                      todayTextColor: '#0066FF',
                      selectedDayBackgroundColor: '#0066FF',
                      selectedDayTextColor: '#FFFFFF'
                    }}
                  />
                </View>

                {selectedDate && (
                  <ScrollView style={styles.timeSlotsContainer}>
                    <Text style={styles.sectionTitle}>Available Times</Text>
                    <View style={styles.timeSlotGrid}>
                      {generateTimeSlots().length > 0 ? (
                        generateTimeSlots().map((slot, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlotButton,
                              selectedTimeSlot === slot && styles.selectedTimeSlot
                            ]}
                            onPress={() => setSelectedTimeSlot(slot)}
                          >
                            <Text style={[
                              styles.timeSlotText,
                              selectedTimeSlot === slot && styles.selectedTimeSlotText
                            ]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noSlotsText}>No available time slots for this date</Text>
                      )}
                    </View>
                  </ScrollView>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleScheduleAppointment}
                  >
                    <Text style={styles.modalButtonText}>Confirm Appointment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowScheduleModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  specialtiesContainer: {
    marginBottom: 16,
  },
  specialtyChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedSpecialtyChip: {
    backgroundColor: '#0066FF',
  },
  specialtyText: {
    color: '#666',
    fontSize: 14,
  },
  selectedSpecialtyText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    marginRight: 15,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#0066FF',
    marginBottom: 2,
  },
  doctorSubSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  doctorHospital: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  doctorAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  doctorPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  npiNumber: {
    fontSize: 12,
    color: '#95a5a6',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  phoneButton: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  phoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarContainer: {
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timeSlotsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timeSlotButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#0066FF',
  },
  timeSlotText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    marginLeft: 8,
  },
  modalButtons: {
    marginTop: 16,
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorInfoContainer: {
    backgroundColor: '#f0f5ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    width: '100%',
  },
});

export default DoctorsScreen; 