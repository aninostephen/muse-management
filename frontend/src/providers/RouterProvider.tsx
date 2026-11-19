import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type AppRoutePath =
  | '/login'
  | '/dashboard'
  | '/creators'
  | '/chatters'
  | '/earnings'
  | '/marketing';

interface RouterContextValue {
  pathname: string;
  navigate: (to: AppRoutePath | string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function normalizePathname(rawPath: string): string {
  const cleaned = rawPath.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return cleaned || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePathname(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback(
    (to: AppRoutePath | string, options?: { replace?: boolean }) => {
      const target = normalizePathname(to);
      if (target === normalizePathname(window.location.pathname)) {
        setPathname(target);
        return;
      }
      if (options?.replace) {
        window.history.replaceState({}, '', target);
      } else {
        window.history.pushState({}, '', target);
      }
      setPathname(target);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [],
  );

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}

/**
 * Accessible SPA Link component that renders a real <a href="..."> tag
 * so right-click / Cmd+Click / middle-click open in a new tab natively,
 * while regular left-clicks use History API pushState navigation.
 */
export function RouterLink({
  to,
  children,
  style,
  className,
  onClick,
}: {
  to: AppRoutePath | string;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} style={style} className={className}>
      {children}
    </a>
  );
}
