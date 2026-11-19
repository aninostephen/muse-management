import { Fragment } from 'react';

const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');

export function isFragment(object: unknown): boolean {
  if (typeof object === 'object' && object !== null) {
    const type = (object as { type?: unknown }).type;
    return type === Fragment || type === REACT_FRAGMENT_TYPE;
  }
  return false;
}

export default {
  isFragment,
};
