// src/components/Alert.tsx

import { appStore } from '../store';
import { usePulse } from '../core/hooks';
import { FunctionalComponent } from '../core/vdom';
import { Button } from './Button';

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
  const [alertVisible, setAlertVisible] = usePulse('alertVisible', appStore);

  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="w-fit"
        label="Show Alert"
        onClick={() => setAlertVisible(true)}
      >
        Show Alert
      </Button>
      {alertVisible && (
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
      )}
    </div>
  );
};
