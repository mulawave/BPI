import { redirect } from "next/navigation";

export default function ThirdPartyMatrixPage() {
  redirect("/dashboard?open=third-party-matrix");
}
