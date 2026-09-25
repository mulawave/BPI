import { redirect } from "next/navigation";

export default function ThirdPartyPage() {
  redirect("/dashboard?open=third-party");
}
