import { ProductEditorScreen } from "@/src/components/products/ProductEditorScreen";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  return <ProductEditorScreen mode="edit" productId={id} />;
}
