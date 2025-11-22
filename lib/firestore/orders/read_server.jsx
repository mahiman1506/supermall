import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// ⭐ Get orders for a specific shop
export const getOrders = async (shopId) => {
  try {
    if (!shopId) return [];

    const q = query(
      collection(db, "orders"),
      where("shopid", "==", shopId) // ← FIXED lowercase field name
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
};

// ⭐ Get ALL orders (rarely needed)
export const getAllOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Error fetching all orders:", err);
    return [];
  }
};
