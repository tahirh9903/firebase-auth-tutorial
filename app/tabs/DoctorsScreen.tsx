import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const [zipCode, setZipCode] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        name: `${result.basic.first_name} ${result.basic.last_name}${result.basic.credential ? ', ' + result.basic.credential : ''}`,
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
      if (name.startsWith('Dr.')) {
        // For generated names, use first two letters of specialty
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
      <TouchableOpacity style={styles.doctorCard}>
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
        </View>
      </TouchableOpacity>
    );
  };

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
});

export default DoctorsScreen; 