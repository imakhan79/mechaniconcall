import { redirect } from "next/navigation";

export default function MechanicVerificationRedirect() {
  redirect("/mechanic/profile");
}
