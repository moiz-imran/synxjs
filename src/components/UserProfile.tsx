// src/components/UserProfile.tsx

import { FunctionalComponent } from '../core/vdom';
import { useStore } from '../core/hooks';
import { Button } from './Button';

export const UserProfile: FunctionalComponent = () => {
  const [userName, setUserName] = useStore('userName');

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
