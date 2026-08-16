import { redirect } from "next/navigation";

export default function PrepareRedirectPage() {
  redirect("/analysis?section=return");
}
