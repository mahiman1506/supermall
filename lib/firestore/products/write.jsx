// import { getAuth } from "firebase/auth";
// import {
//     getFirestore,
//     doc,
//     setDoc,
//     updateDoc,
//     addDoc,
//     deleteDoc,
//     collection,
//     serverTimestamp
// } from "firebase/firestore";
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { storage } from "@/lib/firestore/firebase";

// const db = getFirestore();

// /** CREATE NEW PRODUCT **/
// export const createNewProduct = async ({ data, images, mainImage }) => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (!user) throw new Error("You must be logged in to create a product.");
//     if (!data?.name) throw new Error("Product name is required.");
//     if (!images || images.length === 0) throw new Error("At least one gallery image is needed.");
//     if (!mainImage) throw new Error("Main image is required.");

//     try {
//         // Upload Main Image
//         const mainRef = ref(storage, `product/${Date.now()}_${mainImage.name}`);
//         await uploadBytes(mainRef, mainImage);
//         const mainImageURL = await getDownloadURL(mainRef);

//         // Upload Gallery Images
//         const imagesURL = [];
//         for (const image of images) {
//             const imageRef = ref(storage, `product/gallery_${Date.now()}_${image.name}`);
//             await uploadBytes(imageRef, image);
//             const url = await getDownloadURL(imageRef);
//             imagesURL.push(url);
//         }

//         // Payload to Firestore
//         const payload = {
//             ...data,
//             mainImageURL,
//             images: imagesURL,
//             createdAt: serverTimestamp(),
//             createdBy: user.uid
//         };

//         // Create Document
//         const docRef = await addDoc(collection(db, "product"), payload);
//         return docRef.id;

//     } catch (error) {
//         console.error("Error creating product:", error);
//         throw new Error(error.message || "Failed to create product.");
//     }
// };

// /** UPDATE PRODUCT **/
// export const UpdateProduct = async ({ data, images, mainImage }) => {
//     if (!data?.id) throw new Error("Product ID is required for update.");
//     if (!data?.name) throw new Error("Product name is required.");

//     const id = data.id;
//     const productRef = doc(db, "product", id);

//     try {
//         let mainImageURL = data.mainImageURL || "";
//         let imagesURL = data.images || [];

//         // Upload new main image
//         if (mainImage) {
//             const mainRef = ref(storage, `product/${id}/main_${mainImage.name}`);
//             await uploadBytes(mainRef, mainImage);
//             mainImageURL = await getDownloadURL(mainRef);
//         }

//         // Upload new gallery images
//         if (images && images.length > 0) {
//             imagesURL = [];
//             for (const image of images) {
//                 const imageRef = ref(storage, `product/${id}/gallery_${image.name}`);
//                 await uploadBytes(imageRef, image);
//                 const url = await getDownloadURL(imageRef);
//                 imagesURL.push(url);
//             }
//         }

//         // Update Firestore Document
//         await updateDoc(productRef, {
//             ...data,
//             mainImageURL,
//             images: imagesURL,
//             updatedAt: serverTimestamp()
//         });

//         return true;

//     } catch (error) {
//         console.error("Error updating product:", error);
//         throw new Error(error.message || "Failed to update product.");
//     }
// };

// /** DELETE PRODUCT **/
// export const deleteProduct = async ({ id }) => {
//     if (!id) throw new Error("Product ID is required.");

//     try {
//         const productRef = doc(db, "product", id);
//         await deleteDoc(productRef);
//         return true;
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         throw new Error(error.message || "Failed to delete product.");
//     }
// };

// lib/firestore/products/write.js
import { db } from "@/lib/firestore/firebase";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";

/**
 * createNewProduct
 * @param {Object} param
 * @param {Object} param.data  - product data (must include shopId)
 */
export async function createNewProduct({ data }) {
  if (!data) throw new Error("No product data provided");
  if (!data.shopId) throw new Error("shopId is required for product creation");

  const collRef = collection(db, "products"); // ⭐ Correct collection
  const newDocRef = doc(collRef);
  const ts = Date.now();

  const payload = {
    ...data,
    id: newDocRef.id,
    createdAt: ts,
    updatedAt: ts,
  };

  // ⭐ Ensure shopId is always stored
  if (!payload.shopId) {
    throw new Error("Product missing shopId");
  }

  await setDoc(newDocRef, payload);
  return payload;
}

/**
 * UpdateProduct
 * @param {Object} param
 * @param {Object} param.data - product data (must include id + shopId)
 */
export async function UpdateProduct({ data }) {
  if (!data || !data.id) throw new Error("No product id provided for update");

  if (!data.shopId) throw new Error("Product update missing shopId");

  const docRef = doc(db, "products", data.id);
  const updatedAt = Date.now();

  // Do not overwrite createdAt
  const { id, createdAt, ...rest } = data;

  const payload = {
    ...rest,
    updatedAt,
    shopId: data.shopId, // ⭐ Force preserve shopId
  };

  await updateDoc(docRef, payload);

  return { id: data.id, ...payload };
}
