import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firestore/firebase";

export async function decreaseStock(id, quantity = 1) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Product not found");

  const current = snap.data().stock || 0;
  const newStock = Math.max(0, current - quantity);

  const newStatus = newStock === 0 ? "out_of_stock" : "active";

  await updateDoc(ref, {
    stock: newStock,
    status: newStatus,
    updatedAt: Date.now(),
  });

  return { stock: newStock, status: newStatus };
}
