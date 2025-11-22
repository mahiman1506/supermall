"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firestore/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Page() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchOrders() {
    if (!user?.uid) {
      console.log("⛔ No user yet...");
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(data);
    } catch (error) {
      console.log("❌ FIRESTORE ERROR:", error);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-14 px-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">📦 My Orders</h1>
        </div>

        {loading && (
          <h2 className="text-center text-gray-600 text-lg">Loading...</h2>
        )}

        {!loading && orders.length === 0 && (
          <h2 className="text-center text-gray-500 text-lg">No orders found</h2>
        )}

        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-md rounded-xl p-6 flex justify-between"
            >
              <div>
                {/* clickable order id */}
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowModal(true);
                  }}
                >
                  <h2 className="font-semibold text-xl hover:underline">
                    Order #{order.id}
                  </h2>
                </button>

                <p className="text-gray-600 mt-1">
                  Total: ₹{order.totalAmount}
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  {order.createdAt?.toDate
                    ? new Date(order.createdAt.toDate()).toLocaleString()
                    : "--"}
                </p>
              </div>

              <span
                className={`
    px-4 py-2 rounded-full font-medium
    flex items-center justify-center text-center
    ${order.status === "delivered" && "bg-green-100 text-green-700"}
    ${order.status === "pending" && "bg-yellow-100 text-yellow-700"}
    ${order.status === "cancelled" && "bg-red-100 text-red-700"}
  `}
              >
                {order.status}
              </span>
            </div>
          ))}
        </div>

        {/* ---------------- MODAL ---------------- */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Order Details
              </h2>

              {/* USER DETAILS */}
              <p className="text-gray-700">
                <b>Name:</b> {selectedOrder.meta.address.fullName}
              </p>
              <p className="text-gray-700 mt-1">
                <b>Phone:</b> {selectedOrder.meta.address.phone}
              </p>
              <p className="text-gray-700 mt-1">
                <b>Address:</b> {selectedOrder.meta.address.fullAddress}
              </p>

              {/* ITEMS */}
              <div className="bg-gray-100 rounded-xl p-4 mt-4">
                <h3 className="font-semibold text-lg mb-3">Items</h3>

                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="mb-3 border-b pb-2">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-gray-600 text-sm">
                      Price: ₹{item.price}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Qty: {item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              {/* INFO */}
              <p className="text-gray-700 mt-3">
                <b>Payment Method:</b> {selectedOrder.paymentMethod}
              </p>

              <p className="text-gray-700">
                <b>Status:</b> {selectedOrder.status}
              </p>

              <p className="text-gray-700">
                <b>Delivery Charge:</b> ₹{selectedOrder.deliveryCharge}
              </p>

              <p className="text-gray-800 text-2xl mt-4">
                <b>Total:</b> ₹{selectedOrder.totalAmount}
              </p>

              <button
                onClick={() => setShowModal(false)}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg text-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* ---------------- END MODAL ---------------- */}

        <Link
          href="/dashboard"
          className="block text-center mt-10 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
