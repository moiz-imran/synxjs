import { FunctionalComponent } from '@synxjs/types';
import clsx from 'clsx';

interface TimeTravelButtonProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'undo' | 'redo';
}

export const TimeTravelButton: FunctionalComponent<TimeTravelButtonProps> = ({
  onClick,
  disabled,
  variant,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={variant === 'undo' ? 'Undo' : 'Redo'}
      className={clsx(
        'synx-px-2 synx-py-1 synx-rounded synx-bg-slate-600 synx-text-white disabled:synx-opacity-50',
        variant === 'undo' && 'synx-scale-y-[-1]',
      )}
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx(
          'synx-size-6',
          variant === 'undo' ? '-synx-rotate-[60deg]' : 'synx-rotate-[120deg]',
        )}
      >
        <path
          d="M40.3432 28.9995L19.6569 28.9995C17.5694 28.9995 16.524 26.4756 18.0001 24.9995L27.8787 15.1209C29.0503 13.9493 30.9498 13.9493 32.1214 15.1209L42.0001 24.9995C43.4762 26.4756 42.4307 28.9995 40.3432 28.9995Z"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="4"
        />
        <path
          d="M30 29L30 39C30 54.464 42.536 67 58 67L66 67"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="4"
        />
      </svg>
    </button>
  );
};
