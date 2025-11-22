"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2Icon, Trash2Icon } from "lucide-react";

import { getProducts } from "@/lib/firestore/products/read_server";
import { deleteProduct } from "@/lib/firestore/products/write";
import { useCategory } from "@/lib/firestore/categories/read";

import { db } from "@/lib/firestore/firebase";
import { collection, getDocs } from "firebase/firestore";
import { decreaseStock } from "@/lib/firestore/products/updateStock";

// STATUS BADGE
const StatusBadge = ({ status }) => {
  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-200 text-gray-700",
    draft: "bg-yellow-100 text-yellow-700",
    out_of_stock: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status ? status.replace(/_/g, " ").toUpperCase() : "N/A"}
    </span>
  );
};

export default function Listview() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: categories } = useCategory();

  const getCategoryName = (id) =>
    categories?.find((cat) => cat.id === id)?.name || "Unknown";

  const getShopName = (id) =>
    shops?.find((shop) => shop.id === id)?.name || "Unknown";

  // Fetch Shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const snap = await getDocs(collection(db, "shop"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShops(arr);
      } catch (err) {
        console.error("Error fetching shops:", err);
      }
    };

    fetchShops();
  }, []);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-xl font-semibold">No Products Found</p>
        <button
          onClick={() => router.push("/shop/products/Form")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add Product
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 px-3 sm:px-6 py-4">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr>
              <td className="bg-white px-3 py-2 rounded-l-lg text-center font-semibold">
                SN
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Main Image
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Product Name
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Price
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Category
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Shop
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Stock
              </td>
              <td className="bg-white px-3 py-2 text-center font-semibold">
                Status
              </td>
              <td className="bg-white px-3 py-2 text-center rounded-r-lg font-semibold">
                Actions
              </td>
            </tr>
          </thead>

          <tbody>
            {products.map((p, index) => (
              <tr key={p.id} className="shadow bg-white">
                <td className="text-center py-3">{index + 1}</td>

                <td className="text-center">
                  <img
                    src={p.mainImageURL || "/placeholder.png"}
                    alt={p.name}
                    className="w-10 h-10 object-cover mx-auto"
                  />
                </td>

                <td className="text-center">{p.name}</td>
                <td className="text-center">₹{p.price}</td>

                <td className="text-center">{getCategoryName(p.category)}</td>
                <td className="text-center">{getShopName(p.shopId)}</td>

                <td className="text-center">{p.stock}</td>

                <td className="text-center">
                  <StatusBadge
                    status={p.stock === 0 ? "out_of_stock" : "active"}
                  />
                </td>

                <td className="text-center flex justify-center gap-3 py-2">
                  <button
                    onClick={() =>
                      router.push(`/shop/products/Form?id=${p.id}`)
                    }
                    className="flex items-center gap-1 text-blue-600"
                  >
                    <Edit2Icon size={15} /> Edit
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm(`Delete ${p.name}?`)) return;
                      await deleteProduct({ id: p.id });
                      setProducts(products.filter((prod) => prod.id !== p.id));
                    }}
                    className="flex items-center gap-1 text-red-600"
                  >
                    <Trash2Icon size={15} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {products.map((p, index) => (
          <div key={p.id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between">
              <img
                src={p.mainImageURL || "/placeholder.png"}
                className="h-12 w-12 rounded"
              />
              <StatusBadge status={p.stock === 0 ? "out_of_stock" : "active"} />
            </div>

            <p>
              <b>Name:</b> {p.name}
            </p>
            <p>
              <b>Price:</b> ₹{p.price}
            </p>
            <p>
              <b>Stock:</b> {p.stock}
            </p>
            <p>
              <b>Category:</b> {getCategoryName(p.category)}
            </p>
            <p>
              <b>Shop:</b> {getShopName(p.shopId)}
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => router.push(`/shop/products/Form?id=${p.id}`)}
                className="text-blue-500 text-xs"
              >
                Edit
              </button>

              <button
                onClick={async () => {
                  if (!confirm(`Delete ${p.name}?`)) return;
                  await deleteProduct({ id: p.id });
                  setProducts(products.filter((prod) => prod.id !== p.id));
                }}
                className="text-red-500 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
