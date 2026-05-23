import PluginDetailPage from "@/components/admin/plugins/PluginDetailPage";

export default function AdminPluginDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return <PluginDetailPage slug={params.slug} />;
}
