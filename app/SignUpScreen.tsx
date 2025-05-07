import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { registerUser } from './services/auth';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUp: (data: {
    fullName: string;
    password: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
  }) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onSignUp }) => {
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required and encrypted';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    }

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!/^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/.test(dateOfBirth.trim())) {
      newErrors.dateOfBirth = 'Date must be in MM/DD/YYYY format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await registerUser(email, password, {
        fullName,
        email,
        mobileNumber,
        dateOfBirth,
      });
      
      Alert.alert(
        'Success',
        'Your account has been created successfully!',
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field: string) => {
    if (errors[field]) {
      return <Text style={styles.errorText}>{errors[field]}</Text>;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setErrors({ ...errors, fullName: '' });
            }}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
          {renderError('fullName')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            placeholder="***************"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon 
              name={showPassword ? "visibility-off" : "visibility"} 
              size={24} 
              color="#666666" 
            />
          </TouchableOpacity>
          {renderError('password')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: '' });
            }}
            placeholder="example@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {renderError('email')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={[styles.input, errors.mobileNumber && styles.inputError]}
            value={mobileNumber}
            onChangeText={(text) => {
              setMobileNumber(text);
              setErrors({ ...errors, mobileNumber: '' });
            }}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
          />
          {renderError('mobileNumber')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Date Of Birth</Text>
          <TextInput
            style={[styles.input, errors.dateOfBirth && styles.inputError]}
            value={dateOfBirth}
            onChangeText={(text) => {
              setDateOfBirth(text);
              setErrors({ ...errors, dateOfBirth: '' });
            }}
            placeholder="MM / DD / YYYY"
            keyboardType="numeric"
          />
          {renderError('dateOfBirth')}
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to{' '}
          <Text style={styles.link}>Terms of Use</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>or sign up with</Text>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={20} color="#4267B2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <MaterialCommunityIcons name="fingerprint" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>already have an account?</Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#0066FF',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  showPasswordButton: {
    position: 'absolute' as const,
    right: 16,
    top: 38,
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  link: {
    color: '#0066FF',
  },
  button: {
    height: 50,
    backgroundColor: '#0066FF',
    borderRadius: 25,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  orText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loginContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  loginText: {
    color: '#666666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0066FF',
    fontSize: 14,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default SignUpScreen; 