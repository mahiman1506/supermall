"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firestore/firebase";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ----------------------------------------------------
  // ✅ FETCH CART DATA FROM FIRESTORE
  // ----------------------------------------------------
  const fetchCart = async () => {
    if (!user) return;

    const cartRef = collection(db, "users", user.uid, "cart");
    const snap = await getDocs(cartRef);

    const items = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setCart(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // ----------------------------------------------------
  // ✅ UPDATE QUANTITY
  // ----------------------------------------------------
  const updateQty = async (id, type) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const newQty =
      type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);

    await updateDoc(doc(db, "users", user.uid, "cart", id), {
      quantity: newQty,
    });

    fetchCart(); // refresh UI
  };

  // ----------------------------------------------------
  // ✅ REMOVE ITEM
  // ----------------------------------------------------
  const removeItem = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    fetchCart();
  };

  // ----------------------------------------------------
  // SUBTOTAL
  // ----------------------------------------------------
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center max-w-md w-full animate-fadeIn">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            🔐 Login Required
          </h2>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Please login to view your cart and continue shopping.
          </p>

          <Link
            href="/"
            onClick={() => router.refresh()}
            className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg shadow transition"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-md">
        {/* Go Back Button */}
        <Link
          href="/"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 mb-6 text-gray-700 hover:text-black transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <h2 className="text-2xl font-semibold mb-6">Your Cart</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : cart.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Your cart is empty.</p>
        ) : (
          <div className="space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600">₹{item.price}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQty(item.id, "dec")}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, "inc")}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {cart.length !== 0 && !loading && (
          <div className="mt-10 border-t pt-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>

            <Link href={"/payment_page"}>
              <button className="w-full mt-6 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
