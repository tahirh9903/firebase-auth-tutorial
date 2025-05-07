import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAccessibility } from '../context/AccessibilityContext';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  const { isDarkMode } = useAccessibility();

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#FFFFFF';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#FFFFFF';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#FFFFFF';
  const borderColor = isDarkMode ? '#444444' : '#ddd';
  const disclaimerBackgroundColor = isDarkMode ? '#2d2d1a' : '#fff3cd';
  const disclaimerBorderColor = isDarkMode ? '#444422' : '#ffeeba';
  const disclaimerTextColor = isDarkMode ? '#ffd700' : '#856404';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView 
          style={[styles.content, { backgroundColor }]} 
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
          scrollIndicatorInsets={{ right: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.lastUpdate, { color: secondaryTextColor }]}>Last Update: February 28, 2024</Text>

          <View style={[styles.disclaimerContainer, { 
            backgroundColor: disclaimerBackgroundColor,
            borderColor: disclaimerBorderColor
          }]}>
            <Text style={[styles.disclaimerTitle, { color: disclaimerTextColor }]}>⚠️ IMPORTANT STUDENT PROJECT DISCLAIMER</Text>
            <Text style={[styles.disclaimerText, { color: disclaimerTextColor }]}>
              This application is a student project created as part of a college educational program. It is NOT a real medical application and should NOT be used for any actual medical purposes. The creators are students learning software development, not medical professionals.
            </Text>
            <Text style={[styles.disclaimerText, { color: disclaimerTextColor }]}>
              • This is NOT a real medical service{'\n'}
              • DO NOT rely on this app for any medical decisions{'\n'}
              • NO real medical data should be entered{'\n'}
              • This is for demonstration purposes ONLY{'\n'}
              • The creators CANNOT be held liable for any damages
            </Text>
            <Text style={[styles.disclaimerText, { color: disclaimerTextColor }]}>
              By using this application, you acknowledge that this is a student project and agree that the creators, students, and educational institution cannot be held legally responsible for any damages or consequences resulting from its use.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: textColor }]}>Healthcare Privacy Policy</Text>
          
          <Text style={[styles.paragraph, { color: textColor }]}>
            Welcome to our healthcare application. We are committed to protecting your personal and medical information in accordance with all applicable healthcare privacy laws and regulations, including HIPAA (Health Insurance Portability and Accountability Act).
          </Text>

          <Text style={[styles.subTitle, { color: textColor }]}>1. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            We collect and process the following types of information:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Personal Information: Name, date of birth, contact details, and government-issued ID numbers</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Medical Information: Medical history, prescriptions, treatment plans, and healthcare provider interactions</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Insurance Information: Health insurance details and coverage information</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Usage Data: App interaction, appointment scheduling, and communication preferences</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>2. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            Your information is used to:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Facilitate healthcare appointments and prescription management</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Coordinate care between healthcare providers</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Process insurance claims and payments</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Improve our services and user experience</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Comply with legal and regulatory requirements</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>3. Information Security</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            We implement robust security measures to protect your health information, including:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• End-to-end encryption for data transmission</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Secure storage systems with regular backups</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Access controls and authentication measures</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Regular security audits and updates</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>4. Sharing Your Information</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            We share your information only with:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Healthcare providers involved in your care</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Insurance companies for claims processing</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Regulatory authorities as required by law</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Third-party services essential for app functionality</Text>

          <Text style={[styles.sectionTitle, { color: textColor }]}>Terms & Conditions</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>1. Educational Project Status</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            This application is developed by college students as an educational project. Users explicitly acknowledge and agree that:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• This is a student learning project, not a commercial medical application</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• No actual medical services are provided through this application</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• The creators have no medical qualifications or certifications</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Users waive all rights to legal action against the creators, educational institution, and associated parties</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>1. User Responsibilities</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            By using our application, you agree to:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Provide accurate and up-to-date information</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Maintain the confidentiality of your account credentials</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Use the service for legitimate healthcare purposes only</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Comply with all applicable laws and regulations</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>2. Medical Disclaimer</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            Our application is designed to facilitate healthcare services but is not a substitute for professional medical advice. Always consult qualified healthcare providers for medical decisions. Emergency medical conditions should be treated through appropriate emergency services.
          </Text>

          <Text style={[styles.subTitle, { color: textColor }]}>3. Appointment and Prescription Services</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            Users understand that:
          </Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Appointment availability is subject to provider schedules</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Prescription services require valid prescriber authorization</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Cancellation policies may apply to scheduled appointments</Text>
          <Text style={[styles.bulletPoint, { color: textColor }]}>• Some services may require additional verification</Text>

          <Text style={[styles.subTitle, { color: textColor }]}>4. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            While we strive to maintain accurate and up-to-date information, we cannot guarantee the completeness or accuracy of all data. Users agree that their use of the application is at their own risk.
          </Text>

          <Text style={[styles.subTitle, { color: textColor }]}>5. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: textColor }]}>
            We reserve the right to modify these terms and policies. Users will be notified of significant changes, and continued use of the application constitutes acceptance of updated terms.
          </Text>

          <View style={[styles.footer, { backgroundColor: cardBackgroundColor, borderColor }]}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  disclaimerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default PrivacyPolicyScreen; 