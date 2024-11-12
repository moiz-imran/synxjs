import { FunctionalComponent } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { appStore } from '../store';
import { Button } from './Button';

export const Counter: FunctionalComponent = () => {
  const [count, setCount] = usePulseState('count', appStore);

  const increment = (): void => {
    setCount((c) => c + 1);
  };

  const decrement = (): void => {
    setCount((c) => c - 1);
  };

  const resetCount = (): void => {
    setCount(0);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex space-x-4">
        <Button label="Increment" onClick={increment} variant="success" />
        <Button label="Decrement" onClick={decrement} variant="warning" />
        <Button label="Reset" onClick={resetCount} variant="danger" />
      </div>
      <p className="text-xl">Current Count: {count}</p>
    </div>
  );
};
