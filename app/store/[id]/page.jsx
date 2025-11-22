"use client";

import { useEffect, useState } from "react";
import UserHeader from "../../components/Header";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { app } from "@/lib/firestore/firebase";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function ShopDetailsPage() {
  const { id: shopId } = useParams(); // ⭐ dynamic shopId
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const db = getFirestore(app);

  const getCategoryName = (id) =>
    categories?.find((cat) => cat.id === id)?.name || "Unknown";

  // -------------------------
  // FETCH SHOP + CATEGORIES
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Shop Data
        const shopSnap = await getDocs(collection(db, "shop"));
        const shops = shopSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const foundShop = shops.find((s) => s.id === shopId);
        setShop(foundShop || null);

        // Fetch categories
        const catSnap = await getDocs(collection(db, "categories"));
        setCategories(
          catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error("Error loading shop:", err);
      }
    };

    fetchData();
  }, [shopId]);

  // -------------------------
  // FETCH PRODUCTS FOR SHOP
  // -------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const qRef = query(
          collection(db, "products"),
          where("shopId", "==", shopId)
        );

        const prodSnap = await getDocs(qRef);
        const prodData = prodSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(prodData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) fetchProducts();
  }, [shopId]);

  if (!shop) {
    return (
      <main className="min-h-screen flex justify-center items-center text-xl">
        Shop Not Found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <UserHeader />

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">{shop.name}</h1>

        {/* SHOP DETAILS */}
        <div className="bg-white shadow rounded-xl p-6 mb-10">
          <div className="flex gap-4 items-center">
            <img
              src={shop.logoURL || "/default-shop.png"}
              alt={shop.name}
              className="w-24 object-cover rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold">{shop.name}</h2>
              <p className="text-gray-600">{getCategoryName(shop.category)}</p>
              <p className="text-gray-500 mt-1">Location: {shop.location}</p>
            </div>
          </div>

          {/* Banner */}
          {shop.bannerImage && (
            <div className="mt-4">
              <img
                src={shop.bannerImage}
                alt="shop banner"
                className="w-full rounded-xl"
              />
            </div>
          )}
        </div>

        {/* -------------------------------------- */}
        {/* ⭐ LIST OF PRODUCTS FOR THIS SHOP ⭐ */}
        {/* -------------------------------------- */}
        <h2 className="text-2xl font-semibold mb-4">Products</h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
              >
                {/* Image */}
                <img
                  src={product.mainImageURL || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded"
                />

                <div className="mt-3">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-gray-500 text-sm">
                    ₹ {product.price?.toLocaleString()}
                  </p>

                  <Link
                    href={`/product/${product.id}`}
                    className="mt-3 block bg-blue-600 text-white text-center py-1.5 rounded hover:bg-blue-700 transition text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-10">
            No products found for this shop.
          </p>
        )}
      </section>
    </main>
  );
}
