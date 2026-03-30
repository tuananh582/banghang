import { ProductsDashboard } from "@/src/components/products/ProductsDashboard";

type ProductsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { status } = await searchParams;

  return <ProductsDashboard initialStatus={status ?? null} />;
}
