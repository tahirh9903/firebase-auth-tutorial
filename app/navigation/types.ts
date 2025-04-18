import { NavigatorScreenParams } from '@react-navigation/native';
import { SavedCard } from '../screens/PaymentMethodScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: { userId: string | undefined };
  Settings: undefined;
  PrivacyPolicy: undefined;
  PaymentMethod: undefined;
  PasswordManager: undefined;
  AddCard: { card?: SavedCard };
};

export type RootTabParamList = {
  Home: undefined;
  Doctors: undefined;
  Chat: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Calendar: undefined;
}; 