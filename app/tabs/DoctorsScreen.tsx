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
  ListRenderItem,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';
import PrescriptionServices from '../components/PrescriptionServices';
import { useAccessibility } from '../context/AccessibilityContext';

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

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  hours?: string;
  npi: string;
  type: string;
}

type SearchResult = Doctor | Pharmacy;

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
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#002B5B',
  },
  toggleButtonText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
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
  specialtyChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedSpecialtyChipText: {
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
  pharmacyCard: {
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
  pharmacyImageContainer: {
    marginRight: 15,
  },
  pharmacyInitialsContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyHeaderContainer: {
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  pharmacyType: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 4,
  },
  pharmacyDetailsContainer: {
    flex: 1,
  },
  pharmacyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pharmacyInfoText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  pharmacyNpiNumber: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const DoctorsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isDarkMode, textSize } = useAccessibility();
  const [searchMode, setSearchMode] = useState<'doctors' | 'pharmacies'>('doctors');
  const [zipCode, setZipCode] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
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
  
  // New state variables for pharmacy actions
  const [showPharmacyContactModal, setShowPharmacyContactModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444444' : '#ddd';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const inputBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const inputBorderColor = isDarkMode ? '#444444' : '#ddd';
  const buttonBackgroundColor = isDarkMode ? '#0066cc' : '#50cebb';
  const selectedSpecialtyColor = isDarkMode ? '#0066cc' : '#50cebb';

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

  const searchPharmacies = async () => {
    if (zipCode.length !== 5) {
      setPharmacies([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        postal_code: zipCode,
        limit: '50',
        version: '2.1',
        taxonomy_description: 'Pharmacy',
        taxonomy_code: '333600000X',
      });

      const response = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`);
      const data = await response.json();

      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        setPharmacies([]);
        return;
      }

      const formattedPharmacies: Pharmacy[] = data.results
        .filter((result: any) => result && result.addresses && result.addresses[0])
        .map((result: any) => ({
          id: result.number || '',
          npi: result.number || '',
          name: result.addresses[0]?.organization_name || 
                result.basic?.organization_name || 
                'Pharmacy Name Not Available',
          address: result.addresses[0]?.address_1 && result.addresses[0]?.city && result.addresses[0]?.state
            ? `${result.addresses[0].address_1}, ${result.addresses[0].city}, ${result.addresses[0].state} ${result.addresses[0].postal_code || ''}`
            : 'Address Not Available',
          phoneNumber: result.addresses[0]?.telephone_number || null,
          type: result.addresses[0]?.organization_name?.toLowerCase().includes('24') ? '24-Hour Pharmacy' :
                result.addresses[0]?.organization_name?.toLowerCase().includes('hospital') ? 'Hospital Pharmacy' :
                'Retail Pharmacy'
        }));

      setPharmacies(formattedPharmacies);
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      setError('Failed to fetch pharmacies. Please try again.');
      setPharmacies([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (zipCode.length === 5) {
      if (searchMode === 'doctors') {
        searchDoctors();
      } else {
        searchPharmacies();
      }
    } else if (zipCode.length === 0) {
      setDoctors([]);
      setPharmacies([]);
      setError(null);
    }
  }, [zipCode, selectedSpecialty, searchMode]);

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

  const formatAddress = (address: string) => {
    return address.length > 40 ? address.substring(0, 37) + '...' : address;
  };

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const renderItem: ListRenderItem<SearchResult> = ({ item }) => {
    if ('specialty' in item) {
      return renderDoctorCard({ item: item as Doctor });
    } else {
      return renderPharmacyCard({ item: item as Pharmacy });
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
    const displayAddress = formatAddress(item.address);

    // Format phone number
    const displayPhone = formatPhone(item.phoneNumber);

    const displaySpecialty = formatSpecialty(item.specialty);
    const displayName = formatName(item.name, displaySpecialty);

    return (
      <TouchableOpacity 
        style={[styles.doctorCard, { backgroundColor: cardBackgroundColor }]}
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
            <Text style={[styles.doctorName, { color: textColor }]}>{displayName}</Text>
            <Text style={[styles.doctorSpecialty, { color: secondaryTextColor }]}>{displaySpecialty}</Text>
          </View>
          {item.subSpecialty && item.subSpecialty !== 'undefined' && item.subSpecialty !== 'null' && (
            <Text style={[styles.doctorSubSpecialty, { color: secondaryTextColor }]}>{item.subSpecialty}</Text>
          )}
          {item.hospital && item.hospital !== 'undefined' && item.hospital !== 'null' && (
            <Text style={[styles.doctorHospital, { color: secondaryTextColor }]}>
              <Icon name="business" size={14} color={secondaryTextColor} /> {item.hospital}
            </Text>
          )}
          <Text style={[styles.doctorAddress, { color: secondaryTextColor }]}>
            <Icon name="location-on" size={14} color={secondaryTextColor} /> {displayAddress}
          </Text>
          {displayPhone && (
            <Text style={[styles.doctorPhone, { color: secondaryTextColor }]}>
              <Icon name="phone" size={14} color={secondaryTextColor} /> {displayPhone}
            </Text>
          )}
          <Text style={[styles.npiNumber, { color: secondaryTextColor }]}>
            <Icon name="badge" size={14} color={secondaryTextColor} /> NPI: {item.npi}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.scheduleButton, { backgroundColor: buttonBackgroundColor }]}
              onPress={() => handleSchedulePress(item)}
            >
              <Icon name="calendar-today" size={16} color="#FFFFFF" />
              <Text style={[styles.scheduleButtonText, { color: textColor }]}> Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: buttonBackgroundColor }]}
              onPress={() => {
                setSelectedDoctorForContact(item);
                setShowContactModal(true);
              }}
            >
              <Icon name="phone" size={16} color="#FFFFFF" />
              <Text style={[styles.scheduleButtonText, { color: textColor }]}> Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPharmacyCard = ({ item }: { item: Pharmacy }) => {
    return (
      <TouchableOpacity style={[styles.pharmacyCard, { backgroundColor: cardBackgroundColor }]}>
        <View style={styles.pharmacyImageContainer}>
          <View style={styles.pharmacyInitialsContainer}>
            <Text style={styles.pharmacyInitials}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.pharmacyInfo}>
          <View style={styles.pharmacyHeaderContainer}>
            <Text style={[styles.pharmacyName, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.pharmacyType, { color: secondaryTextColor }]}>{item.type}</Text>
          </View>
          <View style={styles.pharmacyDetailsContainer}>
            <View style={styles.pharmacyInfoRow}>
              <Icon name="location-on" size={16} color={secondaryTextColor} />
              <Text style={[styles.pharmacyInfoText, { color: secondaryTextColor }]}>{formatAddress(item.address)}</Text>
            </View>
            {item.phoneNumber && (
              <View style={styles.pharmacyInfoRow}>
                <Icon name="phone" size={16} color={secondaryTextColor} />
                <Text style={[styles.pharmacyInfoText, { color: secondaryTextColor }]}>{formatPhone(item.phoneNumber)}</Text>
              </View>
            )}
            <Text style={[styles.pharmacyNpiNumber, { color: secondaryTextColor }]}>
              <Icon name="badge" size={14} color={secondaryTextColor} /> NPI: {item.npi}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.scheduleButton, { backgroundColor: buttonBackgroundColor }]}
                onPress={() => {
                  setSelectedPharmacy(item);
                  setShowPrescriptionModal(true);
                }}
              >
                <Icon name="medication" size={16} color="#FFFFFF" />
                <Text style={[styles.scheduleButtonText, { color: textColor }]}> Prescription</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: buttonBackgroundColor }]}
                onPress={() => {
                  setSelectedPharmacy(item);
                  setShowPharmacyContactModal(true);
                }}
              >
                <Icon name="phone" size={16} color="#FFFFFF" />
                <Text style={[styles.scheduleButtonText, { color: textColor }]}> Contact</Text>
              </TouchableOpacity>
            </View>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Healthcare Services</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: headerBackgroundColor }]}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                searchMode === 'doctors' && styles.toggleButtonActive
              ]}
              onPress={() => setSearchMode('doctors')}
            >
              <Text style={[
                styles.toggleButtonText,
                searchMode === 'doctors' && styles.toggleButtonTextActive
              ]}>Find Doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                searchMode === 'pharmacies' && styles.toggleButtonActive
              ]}
              onPress={() => setSearchMode('pharmacies')}
            >
              <Text style={[
                styles.toggleButtonText,
                searchMode === 'pharmacies' && styles.toggleButtonTextActive
              ]}>Find Pharmacies</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="location-on" size={24} color="#666" />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }
              ]}
              placeholder="Enter ZIP Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          {searchMode === 'doctors' && (
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
                      styles.specialtyChipText,
                      selectedSpecialty === specialty && styles.selectedSpecialtyChipText,
                    ]}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.errorText, { color: secondaryTextColor }]}>{error}</Text>
          </View>
        )}

        {isSearching ? (
          <View style={[styles.loadingContainer, { backgroundColor: backgroundColor }]}>
            <ActivityIndicator size="large" color="#002B5B" />
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: backgroundColor }]}>
            <Text style={[styles.errorText, { color: secondaryTextColor }]}>{error}</Text>
          </View>
        ) : (
          <FlatList<SearchResult>
            data={searchMode === 'doctors' ? doctors : pharmacies}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                  {zipCode.length === 5
                    ? `No ${searchMode === 'doctors' ? 'doctors' : 'pharmacies'} found in this area`
                    : `Enter a ZIP code to find ${searchMode === 'doctors' ? 'doctors' : 'pharmacies'}`}
                </Text>
              </View>
            }
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
          <View style={[styles.modalOverlay, { backgroundColor: backgroundColor }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Contact Information</Text>
                {selectedDoctorForContact && (
                  <View style={[styles.contactInfo, { backgroundColor: backgroundColor }]}>
                    <Text style={[styles.doctorName, { color: textColor }]}>{selectedDoctorForContact.name}</Text>
                    <Text style={[styles.doctorSpecialty, { color: secondaryTextColor }]}>{selectedDoctorForContact.specialty}</Text>
                    {selectedDoctorForContact.hospital && (
                      <Text style={[styles.doctorHospital, { color: secondaryTextColor }]}>
                        <Icon name="business" size={14} color={secondaryTextColor} /> {selectedDoctorForContact.hospital}
                      </Text>
                    )}
                    <Text style={[styles.doctorAddress, { color: secondaryTextColor }]}>
                      <Icon name="place" size={14} color={secondaryTextColor} /> {selectedDoctorForContact.address}
                    </Text>
                    {selectedDoctorForContact.phoneNumber && (
                      <TouchableOpacity 
                        style={[styles.phoneButton, { backgroundColor: buttonBackgroundColor }]}
                        onPress={() => {
                          // You can add phone call functionality here
                          Alert.alert('Contact', `Call ${selectedDoctorForContact.phoneNumber}?`);
                        }}
                      >
                        <Icon name="phone" size={20} color="#FFFFFF" />
                        <Text style={[styles.phoneButtonText, { color: textColor }]}>{selectedDoctorForContact.phoneNumber}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: buttonBackgroundColor }]}
                  onPress={() => setShowContactModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: textColor }]}>Close</Text>
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
          <View style={[styles.modalOverlay, { backgroundColor: backgroundColor }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Schedule Appointment</Text>
                {selectedDoctorForContact && (
                  <View style={[styles.doctorInfoContainer, { backgroundColor: backgroundColor }]}>
                    <Text style={[styles.doctorName, { color: textColor }]}>{selectedDoctorForContact.name}</Text>
                    <Text style={[styles.doctorSpecialty, { color: secondaryTextColor }]}>{selectedDoctorForContact.specialty}</Text>
                    {selectedDoctorForContact.hospital && (
                      <Text style={[styles.doctorHospital, { color: secondaryTextColor }]}>
                        <Icon name="business" size={14} color={secondaryTextColor} /> {selectedDoctorForContact.hospital}
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
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Available Times</Text>
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
                              selectedTimeSlot === slot && styles.selectedTimeSlotText,
                              { color: textColor }
                            ]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={[styles.noSlotsText, { color: secondaryTextColor }]}>No available time slots for this date</Text>
                      )}
                    </View>
                  </ScrollView>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleScheduleAppointment}
                  >
                    <Text style={[styles.modalButtonText, { color: textColor }]}>Confirm Appointment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowScheduleModal(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Pharmacy Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPharmacyContactModal}
        onRequestClose={() => setShowPharmacyContactModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPharmacyContactModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: backgroundColor }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Pharmacy Information</Text>
                {selectedPharmacy && (
                  <View style={[styles.contactInfo, { backgroundColor: backgroundColor }]}>
                    <Text style={[styles.pharmacyName, { color: textColor }]}>{selectedPharmacy.name}</Text>
                    <Text style={[styles.pharmacyType, { color: secondaryTextColor, marginBottom: 8 }]}>{selectedPharmacy.type}</Text>
                    <Text style={[styles.pharmacyInfoText, { color: secondaryTextColor }]}>
                      <Icon name="place" size={14} color={secondaryTextColor} /> {selectedPharmacy.address}
                    </Text>
                    {selectedPharmacy.phoneNumber && (
                      <TouchableOpacity 
                        style={[styles.phoneButton, { backgroundColor: buttonBackgroundColor }]}
                        onPress={() => {
                          Alert.alert('Contact', `Call ${selectedPharmacy.phoneNumber}?`);
                        }}
                      >
                        <Icon name="phone" size={20} color="#FFFFFF" />
                        <Text style={[styles.phoneButtonText, { color: textColor }]}>{selectedPharmacy.phoneNumber}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: buttonBackgroundColor }]}
                  onPress={() => setShowPharmacyContactModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: textColor }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Replace the old Prescription Modal with the new PrescriptionServices component */}
      {selectedPharmacy && (
        <PrescriptionServices
          visible={showPrescriptionModal}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedPharmacy(null);
          }}
          pharmacyName={selectedPharmacy.name}
          pharmacyType={selectedPharmacy.type}
        />
      )}
    </SafeAreaView>
  );
};

export default DoctorsScreen; 