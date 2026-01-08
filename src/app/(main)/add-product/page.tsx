
import { AddProductForm } from "./add-product-form";
import { Suspense } from "react";

export default function AddProductPage() {
  return (
    <div className="container mx-auto max-w-2xl px-0">
      <Suspense fallback={<div className="text-center p-8">Chargement du formulaire...</div>}>
        <AddProductForm />
      </Suspense>
    </div>
  );
}
