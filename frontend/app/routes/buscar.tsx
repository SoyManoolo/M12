import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import SearchPage from "~/components/SearchPage";

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  return null;
};

export default function BuscarPage() {
  return <SearchPage />;
} 