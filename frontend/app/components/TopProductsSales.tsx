import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { resolveUploadUrl } from "@/lib/urls";

type SelectedProduct = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  code?: string;
};

type TopProductsSalesProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  selectedProducts?: SelectedProduct[];
};

export default function TopProductsSales({
  backgroundColor = "",
  heading = "Featured Products",
  subheading = "",
  selectedProducts = [],
}: TopProductsSalesProps) {
  const locale = useLocale();

  if (selectedProducts.length === 0) return null;

  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;

  return (
    <section className="py-12" style={backgroundStyle}>
      <div className="mx-auto max-w-7xl px-6">
        {heading && (
          <div className="mb-8">
            {subheading && (
              <p className="text-sm text-slate-500">{subheading}</p>
            )}
            <h2 className="text-2xl font-bold text-[#8b1538]">{heading}</h2>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {selectedProducts.map((product) => {
            const productImage = product.image
              ? resolveUploadUrl(product.image)
              : null;

            return (
              <Link
                key={product.id}
                href={`/${locale}/products/${product.slug}`}
                className="group block rounded-xl p-3 transition-all hover:bg-slate-50 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f5]">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-contain p-4"
                      unoptimized={productImage.includes("localhost")}
                      loading="lazy"
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

                {product.code && (
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {product.code}
                  </p>
                )}

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
