"use client";

import { useEffect, useState } from "react";
import UserHeader from "../components/Header";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firestore/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const db = getFirestore(app);

  const getCategoryName = (id) =>
    categories?.find((cat) => cat.id === id)?.name || "Unknown";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shops
        const shopsSnapshot = await getDocs(collection(db, "shop"));
        const shopData = shopsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setShops(shopData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data: Shop", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <UserHeader />

      <section className="max-w-7xl mx-auto px-4 py-25">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">All Shops</h1>

        {authLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Please Login First
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view the shops
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : shops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops
              .filter((shop) => shop.status !== "Inactive") // ❌ hide inactive shops
              .map((shop) => {
                const isClosed = shop.status === "Closed";
                const isMaintenance = shop.status === "Under Maintenance";

                return (
                  <div
                    key={shop.id}
                    className={`relative rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5
                                            ${
                                              isClosed
                                                ? "bg-red-50 border border-red-200"
                                                : isMaintenance
                                                ? "bg-yellow-50 border border-yellow-200"
                                                : "bg-white"
                                            }
                                        `}
                  >
                    {/* Status Badges */}
                    {isClosed && (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                        CLOSED
                      </span>
                    )}

                    {isMaintenance && (
                      <span className="absolute top-3 right-3 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full">
                        UNDER MAINTENANCE
                      </span>
                    )}

                    {/* Shop Info */}
                    <div className="flex items-center gap-4">
                      <img
                        src={shop.logoURL || "/default-shop.png"}
                        alt={shop.name}
                        className="w-20 object-cover"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          <Link href={`/store/${shop.id}`}>
                            {shop.name || "Unnamed Shop"}
                          </Link>
                        </h2>
                        <p className="text-sm text-gray-500">
                          {getCategoryName(shop.category)}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 text-gray-600 text-sm space-y-1">
                      {shop.owner && (
                        <p>
                          <span className="font-medium text-gray-700">
                            Owner:
                          </span>
                          {shop.owner}
                        </p>
                      )}
                      {shop.email && (
                        <p>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          {shop.email}
                        </p>
                      )}
                      {shop.location && (
                        <p>
                          <span className="font-medium text-gray-700">
                            Location:
                          </span>
                          {shop.location}
                        </p>
                      )}
                    </div>

                    {/* Banner Image */}
                    {shop.bannerImage && (
                      <div className="mt-4">
                        <img
                          src={shop.bannerImage}
                          alt={`${shop.name} banner`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-20">
            No shops found in Firestore.
          </p>
        )}
      </section>
    </main>
  );
}
