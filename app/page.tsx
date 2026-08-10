// import { ThemeToggle } from "@/components/ui//themeToggle";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <ThemeToggle />
//     </div>
//   );
// }

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/getServerSession";

export default async function Home() {
  const session = await getServerSession();

  // 1️⃣ Not logged in → sign-in
  if (!session) {
    redirect("/sign-in");
  }

  // 2️⃣ Admin user
  if (session.user.user_type_id === 1) {
    redirect("/admin");
  }

  // 3️⃣ Normal user
  if (session.user.user_type_id === 2) {
    redirect("/dashboard");
  }

  // 4️⃣ Fallback (unknown role)
  redirect("/sign-in");
}
