import { FunctionalComponent } from '@synxjs/types';
import { useState, useEffect, useRef } from '@synxjs/hooks';
import { PulseStore } from '@synxjs/store';
import clsx from 'clsx';
import { TimeTravelButton } from './TimeTravelButton';

const positionClasses = {
  'bottom-right': 'synx-bottom-4 synx-right-4',
  'bottom-left': 'synx-bottom-4 synx-left-4',
  'top-right': 'synx-top-4 synx-right-4',
  'top-left': 'synx-top-4 synx-left-4',
} as const;

interface DevToolsProps<T extends object> {
  store: PulseStore<T>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'dark' | 'light';
  initialIsOpen?: boolean;
}

export const DevTools = <T extends object>({
  store,
  position = 'bottom-right',
  theme = 'dark',
  initialIsOpen = true,
}: DevToolsProps<T>): FunctionalComponent => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [state, setState] = useState<T | null>(null);
  const [history, setHistory] = useState<T[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const isTimeTraveling = useRef(false);
  const currentIndex = useRef(-1);

  useEffect(() => {
    const cleanup = store.subscribeScoped(
      Object.keys(store.getPulses()) as Array<keyof T>,
      (newState) => {
        setState(newState as T);

        if (!isTimeTraveling.current) {
          setHistory((prev) => {
            const lastEntry = prev[prev.length - 1];
            if (JSON.stringify(lastEntry) === JSON.stringify(newState)) {
              return prev;
            }

            if (currentIndex.current < prev.length - 1) {
              const newHistory = [
                ...prev.slice(0, currentIndex.current + 1),
                newState as T,
              ];
              return newHistory;
            }

            return [...prev, newState as T];
          });

          currentIndex.current += 1;
          setSelectedIndex(currentIndex.current);
        }
        isTimeTraveling.current = false;
      },
    );

    return cleanup;
  }, [store]);

  const timeTravel = (index: number) => {
    if (index < 0 || index >= history.length) return;

    const historicState = history[index];

    isTimeTraveling.current = true;
    store.setPulses(historicState);
    setState(historicState);
    currentIndex.current = index;
    setSelectedIndex(index);
  };

  const bgColor = theme === 'dark' ? 'synx-bg-gray-800' : 'synx-bg-white';
  const textColor = theme === 'dark' ? 'synx-text-white' : 'synx-text-gray-900';

  return (
    <div
      className={clsx('synx-fixed synx-z-50', positionClasses[position], theme)}
      role="complementary"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'synx-rounded-lg synx-shadow-lg synx-mb-2 synx-size-10 flex synx-items-center synx-justify-center',
          bgColor,
          textColor,
        )}
      >
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={clsx('synx-size-8', isOpen && 'synx-rotate-180')}
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18 16C16.8954 16 16 16.8954 16 18L16 62C16 63.1046 16.8954 64 18 64L62 64C63.1046 64 64 63.1046 64 62V18C64 16.8954 63.1046 16 62 16L18 16ZM30.9126 45H49.0131C50.8397 45 51.7545 42.7916 50.4629 41.5L41.819 32.8562C40.7939 31.831 39.1319 31.831 38.1067 32.8562L29.4629 41.5C28.1713 42.7916 29.0861 45 30.9126 45Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={clsx(
            'synx-rounded-lg synx-shadow-lg synx-max-w-md',
            bgColor,
            textColor,
          )}
        >
          <div className="synx-p-4 synx-border-b synx-border-gray-700">
            <div className="synx-flex synx-justify-between synx-items-center">
              <h3 className="synx-text-lg synx-font-bold">
                PulseStore DevTools
              </h3>
              <div className="synx-space-x-2">
                <TimeTravelButton
                  onClick={() => timeTravel(selectedIndex - 1)}
                  disabled={selectedIndex === 0}
                  variant="undo"
                />
                <TimeTravelButton
                  onClick={() => timeTravel(selectedIndex + 1)}
                  disabled={selectedIndex === history.length - 1}
                  variant="redo"
                />
              </div>
            </div>
            <div className="synx-mt-2 synx-text-sm">
              State updates: {history.length}
            </div>
          </div>

          <div className="synx-p-4 synx-space-y-4">
            <div className="synx-space-y-2">
              <label className="synx-block synx-text-sm">
                Time Travel
                <input
                  type="range"
                  min={0}
                  max={history.length - 1}
                  value={selectedIndex}
                  onChange={(e: InputEvent) =>
                    timeTravel(Number((e.target as HTMLInputElement).value))
                  }
                  className="synx-w-full synx-mt-1"
                />
              </label>
            </div>

            <div className="synx-space-y-2">
              <h4 className="synx-font-medium">Current State</h4>
              <pre className="synx-text-sm synx-overflow-auto synx-max-h-96 synx-p-2 synx-rounded synx-bg-white synx-text-gray-900 synx-font-mono">
                {JSON.stringify(state, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
