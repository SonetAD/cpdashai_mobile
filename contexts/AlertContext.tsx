import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert, { AlertType, AlertButton } from '../components/CustomAlert';

interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  loading?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    type: 'info',
    title: '',
    message: '',
    buttons: [{ text: 'OK', style: 'default' }],
    loading: false,
  });

  const showAlert = (options: AlertOptions) => {
    setAlertOptions({
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
      loading: options.loading || false,
    });
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertVisible}
        type={alertOptions.type}
        title={alertOptions.title}
        message={alertOptions.message}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
        loading={alertOptions.loading}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
