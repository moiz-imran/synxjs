// src/components/UserProfile.tsx

import { FunctionalComponent } from 'core/types';
import { usePulse } from 'core/hooks';
import { Button } from './Button';
import { userStore } from '../store';

export const UserProfile: FunctionalComponent = () => {
  const [userName, setUserName] = usePulse('userName', userStore);

  const changeName = () => {
    const newName = prompt('Enter your name:', userName);
    if (newName && newName.trim() !== '') {
      setUserName(newName.trim());
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <span className="text-lg">Hello, {userName}!</span>
      <Button label="Change Name" onClick={changeName} variant="success" />
    </div>
  );
};
