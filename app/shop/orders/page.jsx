"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firestore/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import { Loader2, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";

export default function Page() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const deleteOrder = async (orderId) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(orderId);
      await deleteDoc(doc(db, "orders", orderId));

      // Remove from UI
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete order.");
    } finally {
      setDeletingId(null);
    }
  };

  const badgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No Orders Yet</h2>
          <p className="text-gray-500 mt-2">
            Orders will appear here once placed.
          </p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-xl shadow hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              {/* Left section */}
              <div>
                <h2 className="text-lg font-semibold">Order #{order.id}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {order.createdAt?.seconds
                    ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                    : "—"}
                </p>

                <p className="text-base mt-2 font-medium">
                  Total: ₹{order.totalAmount}
                </p>

                <span
                  className={`mt-2 inline-block px-3 py-1 text-sm rounded-full font-medium ${badgeColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              {/* Right side buttons */}
              <div className="flex gap-3">
                {/* View button */}
                <Link
                  href={`/shop/orders/${order.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  View
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Delete button */}
                <button
                  onClick={() => deleteOrder(order.id)}
                  disabled={deletingId === order.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                    deletingId === order.id
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-red-100 hover:bg-red-200 text-red-700"
                  }`}
                >
                  {deletingId === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
