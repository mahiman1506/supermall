"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { getProducts } from "@/lib/firestore/products/read_server";
import { getOffer } from "@/lib/firestore/offers/read_server";
import { getAllOrders } from "@/lib/firestore/orders/read_server";

/* 🔥 SAME ANIMATION AS ADMIN DASHBOARD */
function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = Math.floor(progress * value);

      setDisplayValue(currentValue);

      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(value);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="text-5xl font-semibold">
      {displayValue.toLocaleString()}
    </span>
  );
}

export default function ShopDashboard() {
  const { user } = useAuth();

  const [productCount, setProductCount] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAll() {
      try {
        setLoading(true);

        const products = await getProducts(user.uid);
        setProductCount(products.length || 0);

        const offers = await getOffer(user.uid);
        setOfferCount(offers.length || 0);

        const orders = await getAllOrders();
        setOrderCount(orders.length);

        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        setRevenue(totalRevenue);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [user]);

  return (
    <div className="w-full flex justify-center py-8">
      <div className="max-w-7xl w-full px-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Welcome back,{" "}
          <span className="text-indigo-600">
            {user?.displayName || "Shop Owner"}
          </span>
        </h1>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            loading={loading}
            value={<AnimatedNumber value={productCount} />}
          />

          <StatCard
            title="Total Offers"
            loading={loading}
            value={<AnimatedNumber value={offerCount} />}
          />

          <StatCard
            title="Total Orders"
            loading={loading}
            value={<AnimatedNumber value={orderCount} />}
          />

          <StatCard
            title="Revenue"
            loading={loading}
            value={
              <span className="text-5xl font-semibold">
                ₹ <AnimatedNumber value={revenue} />
              </span>
            }
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500 py-8">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="mt-3 text-center min-h-[4.5rem] flex items-center justify-center">
        {loading ? <span>...</span> : value}
      </div>
    </div>
  );
}
