import { appStore } from '../store';
import { usePulseState } from '@synxjs/hooks';
import { FunctionalComponent } from '@synxjs/types';
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
  const [alertVisible, setAlertVisible] = usePulseState(
    'alertVisible',
    appStore,
  );

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
      />
      {alertVisible && (
        <div
          className={`p-4 rounded ${typeClasses[type]} flex justify-between items-center`}
          role="alert"
          aria-live="polite"
        >
          <span>{message}</span>
          {dismissible && (
            <button
              className="text-xl font-bold focus:outline-none"
              onClick={() => setAlertVisible(false)}
              aria-label="Close alert"
              type="button"
            >
              &times;
            </button>
          )}
        </div>
      )}
    </div>
  );
};
