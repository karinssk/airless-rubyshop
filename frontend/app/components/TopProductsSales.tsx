"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type SelectedProduct = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  code?: string;
};

type ProductData = {
  id: string;
  name: string;
  slug: string;
  code?: string;
  images?: string[];
};

type TopProductsSalesProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  selectedProducts?: SelectedProduct[];
};

export default function TopProductsSales(props: TopProductsSalesProps) {
  const locale = useLocale();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    backgroundColor = "",
    heading = "Featured Products",
    subheading = "",
    selectedProducts = [],
  } = props;

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedProducts.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendBaseUrl}/products?status=published&locale=th`);
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || [];

          const productMap = new Map(allProducts.map((p: ProductData) => [p.id, p]));
          const orderedProducts = selectedProducts
            .map(sp => productMap.get(sp.id))
            .filter(Boolean) as ProductData[];

          setProducts(orderedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedProducts]);

  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;

  if (loading) {
    return (
      <section className="py-12" style={backgroundStyle}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#8b1538]"></div>
            <p className="mt-2 text-sm text-slate-500">กำลังโหลดสินค้า...</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12" style={backgroundStyle}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        {heading && (
          <div className="mb-8">
            {subheading && (
              <p className="text-sm text-slate-500">{subheading}</p>
            )}
            <h2 className="text-2xl font-bold text-[#8b1538]">{heading}</h2>
          </div>
        )}

        {/* Products Grid - 4 columns */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const productImage =
              product.images && product.images.length > 0
                ? resolveUploadUrl(product.images[0])
                : null;

            return (
              <Link
                key={product.id}
                href={`/${locale}/products/${product.slug}`}
                className="group block rounded-xl p-3 transition-all hover:bg-slate-50 hover:shadow-lg"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f5]">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-contain p-4"
                      unoptimized={productImage.includes("localhost")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <svg
                        className="h-16 w-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Code */}
                {product.code && (
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {product.code}
                  </p>
                )}

                {/* Product Name */}
                <h3 className="mt-1 text-sm leading-snug text-slate-900 group-hover:text-[#8b1538]">
                  {product.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
