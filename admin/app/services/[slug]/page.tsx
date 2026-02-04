import ServiceEditor from "../ServiceEditor";

export default async function ServiceEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ServiceEditor slug={slug} />;
}
