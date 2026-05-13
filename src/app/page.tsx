import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const jar = await cookies();
  if (jar.get("pika_session")?.value === "1") {
    redirect("/dashboard");
  }
  redirect("/login");
}
