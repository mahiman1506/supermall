"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firestore/firebase";
import QRCode from "qrcode";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { createOrder } from "@/lib/firestore/orders/createOrder";

const uploadedFilePath = "/mnt/data/0422dea7-746c-4049-9be8-48746550876c.png";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams ? searchParams.get("productId") : null;
  const { user } = useAuth();

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showPopup, setShowPopup] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;

    if (productId) {
      const snap = await getDocs(collection(db, "products"));
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const product = products.find((p) => p.id === productId);

      if (product) {
        setCart([{ ...product, quantity: 1 }]);
      }
      return;
    }

    const cartRef = collection(db, "users", user.uid, "cart");
    const snap = await getDocs(cartRef);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCart(items);
  };

  useEffect(() => {
    fetchCart();
  }, [user, productId]);

  // ---------------------------
  // PRICE LOGIC
  // ---------------------------
  const itemsTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const productCount = cart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const deliveryCharge = productCount < 3 ? 50 : 0;

  const total = itemsTotal + deliveryCharge;

  // ---------------------------
  // GENERATE UPI QR
  // ---------------------------
  useEffect(() => {
    if (paymentMethod !== "upi" || total <= 0) return;

    const upiID = "9104880776@fam";
    const merchantName = "Super Mall";

    const upiLink = `upi://pay?pa=${upiID}&pn=${merchantName}&am=${total}&cu=INR`;

    QRCode.toDataURL(upiLink).then(setQrCodeURL);
  }, [paymentMethod, total]);

  const clearCart = async () => {
    if (productId) return;

    const cartRef = collection(db, "users", user.uid, "cart");
    const snap = await getDocs(cartRef);

    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db, "users", user.uid, "cart", d.id)))
    );
  };

  const placeOrder = async () => {
    if (!user) throw new Error("User not authenticated");

    const itemsWithShopId = await Promise.all(
      cart.map(async (item) => {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);
        const productData = productSnap.data();

        return {
          id: item.id,
          name: item.name || "Product",
          price: item.price,
          quantity: item.quantity,
          shopId: productData?.shopId || null,
        };
      })
    );

    const mainShopId = itemsWithShopId[0]?.shopId || null;

    const meta = {
      paymentMethod,
      deliveryCharge,
      itemsTotal,
      address: { fullName, phone, email, fullAddress },
      uploadedFilePath,
    };

    const orderId = await createOrder({
      userId: user.uid,
      items: itemsWithShopId,
      total,
      shopId: mainShopId,
      meta,
    });

    return orderId;
  };

  const handlePayNow = async () => {
    if (!fullName || !phone || !email || !fullAddress) {
      alert("Fill all billing details.");
      return;
    }

    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const orderId = await placeOrder();
      await clearCart();

      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        router.push(`/`);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Order failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Please login to checkout.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <h2 className="text-xl font-semibold text-green-600">
              Payment Successful 🎉
            </h2>
            <p className="mt-2">Redirecting...</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
        <Link
          href={productId ? `/product/${productId}` : "/cart"}
          className="flex items-center gap-2 text-gray-700 mb-6"
        >
          <ArrowLeft />
          <span>Back</span>
        </Link>

        <h2 className="text-3xl font-bold mb-8">Checkout</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* LEFT SIDE */}
          <div className="md:col-span-2 space-y-8">
            {/* BILLING */}
            <div className="bg-gray-50 p-5 border rounded-xl">
              <h3 className="text-xl font-semibold mb-5">Billing Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border p-3 rounded-lg"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <input
                  className="border p-3 rounded-lg"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <input
                className="border p-3 rounded-lg w-full mt-4"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <textarea
                rows={3}
                className="border p-3 rounded-lg w-full mt-4"
                placeholder="Full Address"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
              />
            </div>

            {/* PAYMENT */}
            <div className="bg-gray-50 p-5 border rounded-xl">
              <h3 className="text-xl font-semibold mb-5">Payment Method</h3>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                Credit / Debit Card
              </label>

              {paymentMethod === "card" && (
                <div className="p-4 mt-3 border rounded-xl bg-white space-y-3">
                  <input
                    className="border p-3 rounded-lg w-full"
                    placeholder="Card Number"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className="border p-3 rounded-lg"
                      placeholder="MM/YY"
                    />
                    <input
                      className="border p-3 rounded-lg"
                      placeholder="CVV"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 mt-3">
                <input
                  type="radio"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                Cash On Delivery
              </label>

              <label className="flex items-center gap-3 mt-3">
                <input
                  type="radio"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
                UPI / Wallet Payment
              </label>

              {paymentMethod === "upi" && (
                <div className="border p-5 bg-white rounded-xl mt-3 text-center">
                  <input
                    className="border p-3 rounded-lg w-full"
                    placeholder="Enter UPI ID (e.g., name@upi)"
                  />

                  <p className="text-sm text-gray-500 mt-3">OR scan QR</p>

                  {qrCodeURL && (
                    <img
                      src={qrCodeURL}
                      className="w-48 h-48 mx-auto rounded-lg shadow mt-3"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="bg-gray-50 p-5 rounded-xl border h-fit">
            <h3 className="text-xl font-semibold mb-5">Order Summary</h3>

            {/* FREE DELIVERY */}
            <div className="mb-4">
              {productCount < 3 ? (
                <p className="text-sm text-orange-600 font-medium">
                  Add {3 - productCount} more item
                  {3 - productCount > 1 ? "s" : ""} to unlock Free Delivery
                </p>
              ) : (
                <p className="text-sm text-green-600 font-semibold">
                  Free Delivery Unlocked 🎉
                </p>
              )}

              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-500"
                  style={{
                    width: `${Math.min((productCount / 3) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Items Total:</span>
                <span>₹{itemsTotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span
                  className={
                    deliveryCharge === 0 ? "text-green-600 font-semibold" : ""
                  }
                >
                  {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                </span>
              </div>

              <div className="flex justify-between text-lg font-semibold border-t pt-3">
                <span>Total:</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              disabled={loading}
              className={`w-full mt-6 py-3 rounded-lg text-white ${
                loading ? "bg-gray-500" : "bg-black hover:bg-gray-800"
              }`}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
