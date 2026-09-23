import { pageMeta } from '~/utils/seo';
import SearchPage from "~/components/SearchPage";

export const meta = () => pageMeta('Buscar amistades', 'Encuentra personas y conecta con tu comunidad en FriendsGo.', { path: '/buscar' });

export default function BuscarPage() {
  return <SearchPage />;
} 