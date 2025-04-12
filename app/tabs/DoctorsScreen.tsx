import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  imageUrl: string;
  available: boolean;
}

const doctorsData: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    hospital: 'City General Hospital',
    rating: 4.8,
    imageUrl: 'https://via.placeholder.com/150',
    available: true,
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    hospital: 'Metropolitan Medical Center',
    rating: 4.9,
    imageUrl: 'https://via.placeholder.com/150',
    available: true,
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatrician',
    hospital: 'Children\'s Hospital',
    rating: 4.7,
    imageUrl: 'https://via.placeholder.com/150',
    available: false,
  },
];

const DoctorsScreen = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(doctorsData);

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity style={styles.doctorCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.doctorImage} />
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        <Text style={styles.doctorHospital}>{item.hospital}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>Rating: {item.rating}</Text>
          <View style={[styles.availabilityIndicator, { backgroundColor: item.available ? '#4CAF50' : '#F44336' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Doctor</Text>
      <FlatList
        data={doctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  listContainer: {
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
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 5,
  },
  doctorHospital: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 10,
  },
  availabilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default DoctorsScreen; 