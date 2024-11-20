import { createElement } from '@synxjs/vdom';
import { getRouter } from './context';
import { useMemo } from '@synxjs/hooks';

interface LinkProps {
  to: string;
  children?: any;
  className?: string;
}

export function Link({ to, children, ...props }: LinkProps) {
  const router = getRouter();

  const handleClick = useMemo(() => (e: Event) => {
    e.preventDefault();
    router.navigate(to);
  }, [to]);

  return createElement(
    'a',
    {
      href: to,
      onClick: handleClick,
      ...props,
    },
    children,
  );
}
