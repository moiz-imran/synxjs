// src/components/Counter.tsx

import { FunctionalComponent } from '../core/vdom';
import { useStore } from '../core/hooks';
import { Button } from './Button';

export const Counter: FunctionalComponent = () => {
  const [count, setCount] = useStore('count');

  const increment = () => {
    setCount((c) => c + 1);
  };

  const decrement = () => {
    setCount((c) => c - 1);
  };

  const resetCount = () => {
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
