import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.lastUpdate}>Last Update: February 28, 2024</Text>

          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>⚠️ IMPORTANT STUDENT PROJECT DISCLAIMER</Text>
            <Text style={styles.disclaimerText}>
              This application is a student project created as part of a college educational program. It is NOT a real medical application and should NOT be used for any actual medical purposes. The creators are students learning software development, not medical professionals.
            </Text>
            <Text style={styles.disclaimerText}>
              • This is NOT a real medical service{'\n'}
              • DO NOT rely on this app for any medical decisions{'\n'}
              • NO real medical data should be entered{'\n'}
              • This is for demonstration purposes ONLY{'\n'}
              • The creators CANNOT be held liable for any damages
            </Text>
            <Text style={styles.disclaimerText}>
              By using this application, you acknowledge that this is a student project and agree that the creators, students, and educational institution cannot be held legally responsible for any damages or consequences resulting from its use.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Healthcare Privacy Policy</Text>
          
          <Text style={styles.paragraph}>
            Welcome to our healthcare application. We are committed to protecting your personal and medical information in accordance with all applicable healthcare privacy laws and regulations, including HIPAA (Health Insurance Portability and Accountability Act).
          </Text>

          <Text style={styles.subTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect and process the following types of information:
          </Text>
          <Text style={styles.bulletPoint}>• Personal Information: Name, date of birth, contact details, and government-issued ID numbers</Text>
          <Text style={styles.bulletPoint}>• Medical Information: Medical history, prescriptions, treatment plans, and healthcare provider interactions</Text>
          <Text style={styles.bulletPoint}>• Insurance Information: Health insurance details and coverage information</Text>
          <Text style={styles.bulletPoint}>• Usage Data: App interaction, appointment scheduling, and communication preferences</Text>

          <Text style={styles.subTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your information is used to:
          </Text>
          <Text style={styles.bulletPoint}>• Facilitate healthcare appointments and prescription management</Text>
          <Text style={styles.bulletPoint}>• Coordinate care between healthcare providers</Text>
          <Text style={styles.bulletPoint}>• Process insurance claims and payments</Text>
          <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
          <Text style={styles.bulletPoint}>• Comply with legal and regulatory requirements</Text>

          <Text style={styles.subTitle}>3. Information Security</Text>
          <Text style={styles.paragraph}>
            We implement robust security measures to protect your health information, including:
          </Text>
          <Text style={styles.bulletPoint}>• End-to-end encryption for data transmission</Text>
          <Text style={styles.bulletPoint}>• Secure storage systems with regular backups</Text>
          <Text style={styles.bulletPoint}>• Access controls and authentication measures</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>

          <Text style={styles.subTitle}>4. Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We share your information only with:
          </Text>
          <Text style={styles.bulletPoint}>• Healthcare providers involved in your care</Text>
          <Text style={styles.bulletPoint}>• Insurance companies for claims processing</Text>
          <Text style={styles.bulletPoint}>• Regulatory authorities as required by law</Text>
          <Text style={styles.bulletPoint}>• Third-party services essential for app functionality</Text>

          <Text style={styles.sectionTitle}>Terms & Conditions</Text>

          <Text style={styles.subTitle}>1. Educational Project Status</Text>
          <Text style={styles.paragraph}>
            This application is developed by college students as an educational project. Users explicitly acknowledge and agree that:
          </Text>
          <Text style={styles.bulletPoint}>• This is a student learning project, not a commercial medical application</Text>
          <Text style={styles.bulletPoint}>• No actual medical services are provided through this application</Text>
          <Text style={styles.bulletPoint}>• The creators have no medical qualifications or certifications</Text>
          <Text style={styles.bulletPoint}>• Users waive all rights to legal action against the creators, educational institution, and associated parties</Text>

          <Text style={styles.subTitle}>1. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            By using our application, you agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate and up-to-date information</Text>
          <Text style={styles.bulletPoint}>• Maintain the confidentiality of your account credentials</Text>
          <Text style={styles.bulletPoint}>• Use the service for legitimate healthcare purposes only</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>

          <Text style={styles.subTitle}>2. Medical Disclaimer</Text>
          <Text style={styles.paragraph}>
            Our application is designed to facilitate healthcare services but is not a substitute for professional medical advice. Always consult qualified healthcare providers for medical decisions. Emergency medical conditions should be treated through appropriate emergency services.
          </Text>

          <Text style={styles.subTitle}>3. Appointment and Prescription Services</Text>
          <Text style={styles.paragraph}>
            Users understand that:
          </Text>
          <Text style={styles.bulletPoint}>• Appointment availability is subject to provider schedules</Text>
          <Text style={styles.bulletPoint}>• Prescription services require valid prescriber authorization</Text>
          <Text style={styles.bulletPoint}>• Cancellation policies may apply to scheduled appointments</Text>
          <Text style={styles.bulletPoint}>• Some services may require additional verification</Text>

          <Text style={styles.subTitle}>4. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            While we strive to maintain accurate and up-to-date information, we cannot guarantee the completeness or accuracy of all data. Users agree that their use of the application is at their own risk.
          </Text>

          <Text style={styles.subTitle}>5. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms and policies. Users will be notified of significant changes, and continued use of the application constitutes acceptance of updated terms.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              For questions about our privacy policy or terms, please contact our Privacy Officer at privacy@healthcareapp.com
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 24,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  disclaimerContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeeba',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default PrivacyPolicyScreen; 