// src/components/CustomButton.tsx

import { FunctionalComponent } from 'core/types';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Button: FunctionalComponent<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  className,
}) => {
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-500 hover:bg-blue-600'
      : variant === 'secondary'
        ? 'bg-gray-500 hover:bg-gray-600'
        : variant === 'success'
          ? 'bg-green-500 hover:bg-green-600'
          : variant === 'warning'
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : 'bg-red-500 hover:bg-red-600';
  const baseClasses =
    'px-4 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
