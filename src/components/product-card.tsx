import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Use a generic link for search results, or a specific one for internal products
  const productLink = product.id.startsWith('http') ? product.id : `/product/${product.id}`;
  const isExternalLink = product.id.startsWith('http');

  return (
    <Link href={productLink} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="block group">
      <Card className="overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-square relative bg-muted">
          {product.imageUrl ? (
            <Image
                src={product.imageUrl}
                alt={product.name}
                data-ai-hint={product.imageHint}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
             <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <CardContent className="p-3 flex flex-col flex-grow">
          <h3 className="font-semibold text-sm truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:text-wrap">{product.name}</h3>
          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
          <div className="flex-grow"></div>
           <div className="flex justify-between items-end mt-2">
            {product.category && <Badge variant="secondary" className="hidden sm:inline-flex">{product.category}</Badge>}
            {product.price && (
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">dès</p>
                    <p className="font-bold text-primary leading-none">{product.price.toFixed(2)} DH</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
