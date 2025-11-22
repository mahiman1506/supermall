// import { collection, getDocs, doc, getDoc } from "firebase/firestore"
// import { db } from "../firebase"

// // Get all products
// export const getProducts = async () => {
//     try {
//         const querySnapshot = await getDocs(collection(db, "products"));
//         return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         throw error;
//     }
// };

// // Get a single product by ID
// export const getProduct = async (productId) => {
//     if (!productId) throw new Error("Product ID is required");

//     try {
//         const docRef = doc(db, "products", productId);
//         const docSnap = await getDoc(docRef);

//         if (!docSnap.exists()) {
//             throw new Error("Product not found");
//         }

//         return { id: docSnap.id, ...docSnap.data() };
//     } catch (error) {
//         console.error("Error fetching product:", error);
//         throw error;
//     }
// };

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ✅ Get all products
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products")); // ✅ fixed collection name

    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error(error.message || "Failed to fetch products");
  }
};

// ✅ Get single product
export const getProduct = async (productId) => {
  if (!productId) throw new Error("Product ID is required");

  try {
    const docRef = doc(db, "products", productId); // ✅ fixed collection name
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Product not found");
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error(error.message || "Failed to fetch product");
  }
};
