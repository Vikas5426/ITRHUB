import { redirect } from "next/navigation";

export default function DocumentsRedirectPage() {
  redirect("/intake?section=documents");
}
