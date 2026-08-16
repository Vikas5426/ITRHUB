import { redirect } from "next/navigation";

export default function IncomeRedirectPage() {
  redirect("/intake?section=income");
}
