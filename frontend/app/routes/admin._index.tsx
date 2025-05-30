import { redirect } from "@remix-run/node";

export function loader() {
  return redirect("/admin/publicaciones");
}

export default function AdminIndex() {
  return null;
} 