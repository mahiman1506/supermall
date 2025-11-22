"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firestore/firebase";
import { ArrowLeftCircleIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setProduct(data);

          if (data.category) {
            const catRef = doc(db, "categories", data.category);
            const catSnap = await getDoc(catRef);
            setCategoryName(catSnap.exists() ? catSnap.data().name : "Unknown");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const isOutOfStock = product ? product.stock <= 0 : false;
  const isDraft = product ? product.status === "draft" : false;
  const isDisabled = isOutOfStock || isDraft;

  const handleAddToCartClick = () => {
    if (!user) return alert("Please login to add products.");

    addToCart({
      id,
      name: product.name,
      price: product.price,
      image: product.mainImageURL,
    });

    setShowPopup(true);
  };

  const handleBuyNow = () => {
    if (isDisabled) return;
    router.push(`/payment_page?productId=${id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (!product)
    return (
      <h1 className="text-center text-2xl py-20 text-red-500">
        Product Not Found
      </h1>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6 flex flex-col items-center">
      {/* POPUP */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-green-600">
              Added to Cart 🛒
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Item added successfully.
            </p>

            <button
              onClick={() => router.push("/cart")}
              className="w-full mt-5 bg-indigo-600 text-white py-2 rounded-lg"
            >
              Go to Cart
            </button>

            <button
              onClick={() => setShowPopup(false)}
              className="w-full mt-3 bg-gray-200 dark:bg-slate-700 py-2 rounded-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-5xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-10 flex flex-col md:flex-row gap-10">
        {/* LEFT IMAGE */}
        <div className="md:w-1/2">
          <div className="w-full h-80 bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden">
            <img
              src={product.mainImageURL}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* RIGHT DETAILS */}
        <div className="md:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-semibold text-indigo-600">
            ₹ {product.price}
          </p>

          <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {categoryName}
          </span>

          <p>
            <strong>Stock:</strong>{" "}
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </p>

          <p>
            <strong>SKU:</strong> {product.sku}
          </p>
          <p>
            <strong>Brand:</strong> {product.brand}
          </p>
          <p>
            <strong>Description:</strong>
            <br />
            {product.description}
          </p>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleAddToCartClick}
              disabled={isDisabled}
              className={`flex-1 py-3 rounded-lg text-white ${
                isDisabled ? "bg-indigo-600 opacity-50" : "bg-indigo-600"
              }`}
            >
              Add to Cart
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isDisabled}
              className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-slate-700"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-10 bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2"
      >
        <ArrowLeftCircleIcon className="w-5 h-5" /> Go Back
      </button>
    </div>
  );
}
