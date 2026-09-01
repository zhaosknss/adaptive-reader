import { ProfileDetailScreen } from "@/components/ProfileDetailScreen";

export default async function MeSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <ProfileDetailScreen section={section} />;
}
