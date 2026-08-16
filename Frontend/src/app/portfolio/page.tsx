import { redirect } from "next/navigation";

export default function PortfolioRedirectPage() {
  redirect("/intake?section=investments");
}
