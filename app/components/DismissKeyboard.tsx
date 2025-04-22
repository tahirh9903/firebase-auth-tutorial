import React from 'react';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';

interface DismissKeyboardProps {
  children: React.ReactNode;
}

const DismissKeyboard: React.FC<DismissKeyboardProps> = ({ children }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {children}
  </TouchableWithoutFeedback>
);

export default DismissKeyboard; 