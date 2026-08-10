import { requireAdmin } from "@/app/data/require-admin";
import { getServerSession } from "@/lib/getServerSession";
import { prisma } from "@/lib/prisma";
import { UpdatesPageClient } from "./_components/UpdatesPageClient";

const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL || "ramindu.jiat@gmail.com";

export default async function UpdatesPage() {
  await requireAdmin();
  const session = await getServerSession();
  const isMaster = session?.user.email === MASTER_EMAIL;

  // Fetch current feature flags from DB
  const flags = await prisma.featureFlag.findMany();
  const history = await prisma.updateHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <UpdatesPageClient
      isMaster={isMaster}
      adminEmail={session?.user.email || ""}
      flags={flags}
      history={history}
    />
  );
}
