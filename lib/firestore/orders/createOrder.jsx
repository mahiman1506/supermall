import { db } from "@/lib/firestore/firebase";
import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export async function createOrder({ userId, items, total, shopId, meta }) {
  return await runTransaction(db, async (transaction) => {
    // 1. Create new order reference
    const orderRef = doc(db, "orders", crypto.randomUUID());

    // 2. Decrease stock safely
    for (const item of items) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product "${item.name}" does not exist.`);
      }

      const currentStock = productSnap.data().stock || 0;
      const newStock = currentStock - item.quantity;

      if (newStock < 0) {
        throw new Error(`Not enough stock for ${item.name}`);
      }

      transaction.update(productRef, { stock: newStock });
    }

    // 3. Order Data (NOW INCLUDES shopId)
    const orderData = {
      userId,
      shopId: shopId || null, // ⭐ FIXED — SAVE SHOP ID

      items,
      totalAmount: total,
      status: "pending",
      createdAt: serverTimestamp(),

      paymentMethod: meta.paymentMethod,
      deliveryCharge: meta.deliveryCharge,
      itemsTotal: meta.itemsTotal,

      customer: {
        fullName: meta.address.fullName,
        phone: meta.address.phone,
        email: meta.address.email,
        fullAddress: meta.address.fullAddress,
      },

      uploadedFilePath: meta.uploadedFilePath || null,

      meta, // optional: store everything
    };

    // 4. Save order
    transaction.set(orderRef, orderData);

    return orderRef.id;
  });
}
