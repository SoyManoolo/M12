import { pageMeta } from '~/utils/seo';
import { redirect } from "react-router";

export function loader() {
  return redirect("/admin/publicaciones");
}

export const meta = () => pageMeta('Administración', 'Administración de FriendsGo.', { path: '/admin' });

export default function AdminIndex() {
  return null;
} 