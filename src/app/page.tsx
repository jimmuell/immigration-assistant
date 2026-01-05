import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles auth redirects, so if we reach here, redirect to landing
  redirect("/landing");
}
