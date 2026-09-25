import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";

// Temporary home screen: the full dashboard is built in the last feature.
export default async function HomePage() {
  const { centre } = await getCentre();

  return <PageHeader title={`Namaste! 🙏`} description={centre.name} />;
}
