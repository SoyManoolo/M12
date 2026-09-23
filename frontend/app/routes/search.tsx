import { redirect } from 'react-router';
import type { LoaderFunction } from 'react-router';

/** Keep old shared links working while `/buscar` remains the single search experience. */
export const loader: LoaderFunction = () => redirect('/buscar');

export default function LegacySearchRoute() {
  return null;
}
