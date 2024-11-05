// src/components/Hello.tsx

import { FunctionalComponent } from '../core/vdom';

interface HelloProps {
  name: string;
}

export const Hello: FunctionalComponent<HelloProps> = ({ name }) => {
  return (
    <div className="text-center text-2xl text-blue-500">Hello, {name}!</div>
  );
};
