import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Sample medication data
const SAMPLE_MEDICATIONS = [
  {
    id: '1',
    name: 'Lisinopril',
    strength: '10mg',
    type: 'Tablet',
    refillsRemaining: 3,
    lastFilled: '2024-02-15',
    pharmacy: 'CVS Pharmacy',
  },
  {
    id: '2',
    name: 'Metformin',
    strength: '500mg',
    type: 'Tablet',
    refillsRemaining: 2,
    lastFilled: '2024-02-20',
    pharmacy: 'Walgreens',
  },
  {
    id: '3',
    name: 'Atorvastatin',
    strength: '20mg',
    type: 'Tablet',
    refillsRemaining: 1,
    lastFilled: '2024-02-10',
    pharmacy: 'Rite Aid',
  },
  {
    id: '4',
    name: 'Sertraline',
    strength: '50mg',
    type: 'Tablet',
    refillsRemaining: 4,
    lastFilled: '2024-02-18',
    pharmacy: 'Walmart Pharmacy',
  },
  {
    id: '5',
    name: 'Levothyroxine',
    strength: '75mcg',
    type: 'Tablet',
    refillsRemaining: 2,
    lastFilled: '2024-02-12',
    pharmacy: 'CVS Pharmacy',
  },
  {
    id: '6',
    name: 'Amlodipine',
    strength: '5mg',
    type: 'Tablet',
    refillsRemaining: 0,
    lastFilled: '2024-01-25',
    pharmacy: 'Walgreens',
  },
  {
    id: '7',
    name: 'Gabapentin',
    strength: '300mg',
    type: 'Capsule',
    refillsRemaining: 1,
    lastFilled: '2024-02-05',
    pharmacy: 'Rite Aid',
  },
  {
    id: '8',
    name: 'Escitalopram',
    strength: '10mg',
    type: 'Tablet',
    refillsRemaining: 3,
    lastFilled: '2024-02-22',
    pharmacy: 'CVS Pharmacy',
  },
  {
    id: '9',
    name: 'Pantoprazole',
    strength: '40mg',
    type: 'Tablet',
    refillsRemaining: 2,
    lastFilled: '2024-02-08',
    pharmacy: 'Walmart Pharmacy',
  },
  {
    id: '10',
    name: 'Montelukast',
    strength: '10mg',
    type: 'Tablet',
    refillsRemaining: 1,
    lastFilled: '2024-02-17',
    pharmacy: 'Walgreens',
  }
];

// Common medications for new prescriptions
const COMMON_MEDICATIONS = [
  // Antibiotics
  {
    id: '1',
    name: 'Amoxicillin',
    availableStrengths: ['250mg', '500mg', '875mg'],
    types: ['Capsule', 'Tablet', 'Suspension'],
    category: 'Antibiotic'
  },
  {
    id: '2',
    name: 'Azithromycin',
    availableStrengths: ['250mg', '500mg'],
    types: ['Tablet', 'Suspension'],
    category: 'Antibiotic'
  },
  {
    id: '3',
    name: 'Cephalexin',
    availableStrengths: ['250mg', '500mg'],
    types: ['Capsule', 'Suspension'],
    category: 'Antibiotic'
  },
  // Pain Medications
  {
    id: '4',
    name: 'Ibuprofen',
    availableStrengths: ['200mg', '400mg', '600mg', '800mg'],
    types: ['Tablet', 'Capsule', 'Suspension'],
    category: 'Pain Relief'
  },
  {
    id: '5',
    name: 'Acetaminophen',
    availableStrengths: ['325mg', '500mg', '650mg'],
    types: ['Tablet', 'Capsule', 'Liquid'],
    category: 'Pain Relief'
  },
  {
    id: '6',
    name: 'Tramadol',
    availableStrengths: ['50mg', '100mg'],
    types: ['Tablet', 'Capsule'],
    category: 'Pain Relief'
  },
  // Gastrointestinal
  {
    id: '7',
    name: 'Omeprazole',
    availableStrengths: ['20mg', '40mg'],
    types: ['Capsule', 'Tablet'],
    category: 'Gastrointestinal'
  },
  {
    id: '8',
    name: 'Ranitidine',
    availableStrengths: ['150mg', '300mg'],
    types: ['Tablet', 'Syrup'],
    category: 'Gastrointestinal'
  },
  // Mental Health
  {
    id: '9',
    name: 'Sertraline',
    availableStrengths: ['25mg', '50mg', '100mg'],
    types: ['Tablet'],
    category: 'Mental Health'
  },
  {
    id: '10',
    name: 'Fluoxetine',
    availableStrengths: ['10mg', '20mg', '40mg'],
    types: ['Capsule', 'Tablet'],
    category: 'Mental Health'
  },
  // Allergy Medications
  {
    id: '11',
    name: 'Cetirizine',
    availableStrengths: ['5mg', '10mg'],
    types: ['Tablet', 'Liquid'],
    category: 'Allergy'
  },
  {
    id: '12',
    name: 'Loratadine',
    availableStrengths: ['10mg'],
    types: ['Tablet', 'Liquid'],
    category: 'Allergy'
  },
  // Heart Medications
  {
    id: '13',
    name: 'Lisinopril',
    availableStrengths: ['2.5mg', '5mg', '10mg', '20mg'],
    types: ['Tablet'],
    category: 'Heart'
  },
  {
    id: '14',
    name: 'Metoprolol',
    availableStrengths: ['25mg', '50mg', '100mg'],
    types: ['Tablet'],
    category: 'Heart'
  },
  // Diabetes Medications
  {
    id: '15',
    name: 'Metformin',
    availableStrengths: ['500mg', '850mg', '1000mg'],
    types: ['Tablet'],
    category: 'Diabetes'
  },
  {
    id: '16',
    name: 'Glipizide',
    availableStrengths: ['5mg', '10mg'],
    types: ['Tablet'],
    category: 'Diabetes'
  },
  // Respiratory Medications
  {
    id: '17',
    name: 'Albuterol',
    availableStrengths: ['2mg', '4mg'],
    types: ['Tablet', 'Inhaler', 'Nebulizer Solution'],
    category: 'Respiratory'
  },
  {
    id: '18',
    name: 'Montelukast',
    availableStrengths: ['4mg', '5mg', '10mg'],
    types: ['Tablet', 'Chewable'],
    category: 'Respiratory'
  },
  // Cholesterol Medications
  {
    id: '19',
    name: 'Atorvastatin',
    availableStrengths: ['10mg', '20mg', '40mg', '80mg'],
    types: ['Tablet'],
    category: 'Cholesterol'
  },
  {
    id: '20',
    name: 'Simvastatin',
    availableStrengths: ['5mg', '10mg', '20mg', '40mg'],
    types: ['Tablet'],
    category: 'Cholesterol'
  }
];

interface PrescriptionServicesProps {
  visible: boolean;
  onClose: () => void;
  pharmacyName: string;
  pharmacyType: string;
}

const PrescriptionServices: React.FC<PrescriptionServicesProps> = ({
  visible,
  onClose,
  pharmacyName,
  pharmacyType,
}) => {
  const [activeView, setActiveView] = useState<'main' | 'new' | 'transfer' | 'refill'>('main');
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrength, setSelectedStrength] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  const handleNewPrescription = () => {
    setActiveView('new');
  };

  const handleTransferPrescription = () => {
    setActiveView('transfer');
  };

  const handleRefillPrescription = () => {
    setActiveView('refill');
  };

  const handleMedicationSelect = (medication: any) => {
    if (selectedMedication?.id === medication.id) {
      // Deselect if the same medication is tapped again
      setSelectedMedication(null);
      setSelectedStrength('');
      setSelectedType('');
    } else {
      setSelectedMedication(medication);
      setSelectedStrength('');
      setSelectedType('');
    }
  };

  const handleStrengthSelect = (strength: string) => {
    if (selectedStrength === strength) {
      // Deselect if the same strength is tapped again
      setSelectedStrength('');
    } else {
      setSelectedStrength(strength);
    }
  };

  const handleTypeSelect = (type: string) => {
    if (selectedType === type) {
      // Deselect if the same type is tapped again
      setSelectedType('');
    } else {
      setSelectedType(type);
    }
  };

  const handleSubmitNewPrescription = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to submit a prescription request');
        return;
      }

      if (!selectedMedication) {
        Alert.alert('Error', 'Please select a medication');
        return;
      }

      if (!selectedStrength) {
        Alert.alert('Error', 'Please select a medication strength');
        return;
      }

      if (!selectedType) {
        Alert.alert('Error', 'Please select a medication type');
        return;
      }

      const requestData = {
        type: 'new',
        status: 'pending',
        medicationName: selectedMedication?.name || '',
        strength: selectedStrength,
        medicationType: selectedType,
        pharmacy: pharmacyName,
        requestDate: new Date().toISOString(),
        userId: auth.currentUser.uid,
        description: prescriptionNotes,
        createdAt: serverTimestamp()
      };

      const requestsRef = collection(db, 'prescriptionRequests');
      await addDoc(requestsRef, requestData);

      Alert.alert(
        'Success',
        'Your prescription request has been submitted successfully',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting new prescription request:', error);
      Alert.alert('Error', 'Failed to submit prescription request. Please try again.');
    }
  };

  const handleSubmitTransfer = async (medication: any) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to submit a transfer request');
        return;
      }

      const requestData = {
        type: 'transfer',
        status: 'pending',
        medicationName: medication.name,
        strength: medication.strength,
        pharmacy: pharmacyName,
        requestDate: new Date().toISOString(),
        userId: auth.currentUser.uid,
        description: `Transfer from ${medication.pharmacy}`,
        createdAt: serverTimestamp()
      };

      const requestsRef = collection(db, 'prescriptionRequests');
      await addDoc(requestsRef, requestData);

      Alert.alert(
        'Success',
        'Your transfer request has been submitted successfully',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting transfer request:', error);
      Alert.alert('Error', 'Failed to submit transfer request. Please try again.');
    }
  };

  const handleSubmitRefill = async (medication: any) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to submit a refill request');
        return;
      }

      const requestData = {
        type: 'refill',
        status: 'pending',
        medicationName: medication.name,
        strength: medication.strength,
        pharmacy: pharmacyName,
        requestDate: new Date().toISOString(),
        userId: auth.currentUser.uid,
        description: `Refill request for existing prescription`,
        createdAt: serverTimestamp()
      };

      const requestsRef = collection(db, 'prescriptionRequests');
      await addDoc(requestsRef, requestData);

      Alert.alert(
        'Success',
        'Your refill request has been submitted successfully',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting refill request:', error);
      Alert.alert('Error', 'Failed to submit refill request. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedMedication(null);
    setSelectedStrength('');
    setSelectedType('');
    setSearchQuery('');
    setPrescriptionNotes('');
  };

  const renderNewPrescriptionView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>New Prescription</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search medications..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView style={styles.medicationList}>
        {Object.entries(
          COMMON_MEDICATIONS
            .filter(med => 
              med.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .reduce((acc, med) => {
              if (!acc[med.category]) {
                acc[med.category] = [];
              }
              acc[med.category].push(med);
              return acc;
            }, {} as Record<string, typeof COMMON_MEDICATIONS>)
        ).map(([category, medications]) => (
          <View key={category}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {medications.map(medication => (
              <TouchableOpacity
                key={medication.id}
                style={[
                  styles.medicationItem,
                  selectedMedication?.id === medication.id && styles.selectedItem,
                ]}
                onPress={() => handleMedicationSelect(medication)}
              >
                <Text style={[
                  styles.medicationName,
                  selectedMedication?.id === medication.id && styles.selectedText
                ]}>
                  {medication.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {selectedMedication && (
        <>
          <Text style={styles.subTitle}>Select Strength</Text>
          <ScrollView horizontal style={styles.optionsList}>
            {selectedMedication.availableStrengths.map((strength: string) => (
              <TouchableOpacity
                key={strength}
                style={[
                  styles.optionItem,
                  selectedStrength === strength && styles.selectedOption,
                ]}
                onPress={() => handleStrengthSelect(strength)}
              >
                <Text style={[
                  styles.optionText,
                  selectedStrength === strength && styles.selectedText
                ]}>
                  {strength}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.subTitle}>Select Type</Text>
          <ScrollView horizontal style={styles.optionsList}>
            {selectedMedication.types.map((type: string) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionItem,
                  selectedType === type && styles.selectedOption,
                ]}
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={[
                  styles.optionText,
                  selectedType === type && styles.selectedText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmitNewPrescription}
        >
          <Text style={styles.buttonText}>Submit Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setActiveView('main');
            resetForm();
          }}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransferView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Transfer Prescription</Text>
      <ScrollView style={styles.medicationList}>
        {SAMPLE_MEDICATIONS.map(medication => (
          <TouchableOpacity
            key={medication.id}
            style={styles.medicationItem}
            onPress={() => handleSubmitTransfer(medication)}
          >
            <View>
              <Text style={styles.medicationName}>
                {medication.name} {medication.strength}
              </Text>
              <Text style={styles.medicationDetails}>
                Current Pharmacy: {medication.pharmacy}
              </Text>
              <Text style={styles.medicationDetails}>
                Last Filled: {medication.lastFilled}
              </Text>
            </View>
            <Icon name="arrow-forward" size={24} color="#4CAF50" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => setActiveView('main')}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRefillView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Refill Prescription</Text>
      <ScrollView style={styles.medicationList}>
        {SAMPLE_MEDICATIONS.map(medication => (
          <TouchableOpacity
            key={medication.id}
            style={styles.medicationItem}
            onPress={() => handleSubmitRefill(medication)}
          >
            <View>
              <Text style={styles.medicationName}>
                {medication.name} {medication.strength}
              </Text>
              <Text style={styles.medicationDetails}>
                Refills Remaining: {medication.refillsRemaining}
              </Text>
              <Text style={styles.medicationDetails}>
                Last Filled: {medication.lastFilled}
              </Text>
            </View>
            {medication.refillsRemaining > 0 && (
              <Icon name="refresh" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => setActiveView('main')}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMainView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.pharmacyName}>{pharmacyName}</Text>
      <Text style={styles.pharmacyType}>{pharmacyType}</Text>
      
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
        onPress={handleNewPrescription}
      >
        <Icon name="medication" size={24} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>New Prescription</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
        onPress={handleTransferPrescription}
      >
        <Icon name="swap-horiz" size={24} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Transfer Prescription</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
        onPress={handleRefillPrescription}
      >
        <Icon name="refresh" size={24} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Refill Prescription</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeView === 'main' && renderMainView()}
            {activeView === 'new' && renderNewPrescriptionView()}
            {activeView === 'transfer' && renderTransferView()}
            {activeView === 'refill' && renderRefillView()}
          </ScrollView>
          
          {activeView === 'main' && (
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  pharmacyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pharmacyType: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  medicationList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  medicationItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  optionsList: {
    flexGrow: 0,
    marginBottom: 16,
    height: 60,
  },
  optionItem: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    height: 44,
    justifyContent: 'center',
    minWidth: 80,
  },
  selectedOption: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  closeButton: {
    backgroundColor: '#ff6b6b',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
});

export default PrescriptionServices; 