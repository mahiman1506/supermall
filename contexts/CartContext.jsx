"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firestore/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // REAL-TIME LISTENER
  useEffect(() => {
    if (!user) {
      setCart([]);
      setCartCount(0);
      return;
    }

    const cartRef = collection(db, "users", user.uid, "cart");

    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCart(items);

      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    });

    return () => unsubscribe();
  }, [user]);

  // ADD TO CART (OVERWRITE IF EXISTS)
  const addToCart = async (product) => {
    if (!user) return;

    const itemRef = doc(db, "users", user.uid, "cart", product.id);

    await setDoc(itemRef, {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
    });
  };

  // REMOVE ITEM
  const removeFromCart = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
  };

  return (
    <CartContext.Provider
      value={{ cart, cartCount, addToCart, removeFromCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
