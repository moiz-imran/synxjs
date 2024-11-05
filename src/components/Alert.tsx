// src/components/Alert.tsx

import { useStore } from '../core/hooks';
import { FunctionalComponent } from '../core/vdom';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  dismissible?: boolean;
}

export const Alert: FunctionalComponent<AlertProps> = ({
  message,
  type = 'info',
  dismissible = false,
}) => {
  const [alertVisible, setAlertVisible] = useStore('alertVisible');

  if (!alertVisible) {
    return null;
  }

  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div
      className={`p-4 rounded ${typeClasses[type]} flex justify-between items-center`}
    >
      <span>{message}</span>
      {dismissible && (
        <button
          className="text-xl font-bold focus:outline-none"
          onClick={() => setAlertVisible(false)}
        >
          &times;
        </button>
      )}
    </div>
  );
};
