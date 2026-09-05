import { redirect } from "react-router";

export function loader() {
  return redirect("/admin/publicaciones");
}

export default function AdminIndex() {
  return null;
} 