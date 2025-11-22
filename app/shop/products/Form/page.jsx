"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  createNewProduct,
  UpdateProduct,
} from "@/lib/firestore/products/write";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firestore/firebase";

import { getCategories } from "@/lib/firestore/categories/read_server";
import { getProduct } from "@/lib/firestore/products/read_server";

import { useAuth } from "@/contexts/AuthContext";

import { db } from "@/lib/firestore/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { user } = useAuth();

  const [data, setData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    sku: "",
    tags: "",
    description: "",
    status: "active",
    mainImageURL: "",
    images: [],
    shopId: "", // <-- NEW FIELD
  });

  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]); // <-- SHOP LIST

  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);

  const [images, setImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ------------------------------
  // HANDLE INPUT CHANGES
  // ------------------------------

  const handleData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));

    if (field === "stock") {
      const v = Number(value);
      if (v === 0) setData((prev) => ({ ...prev, status: "out_of_stock" }));
      else if (v > 0) setData((prev) => ({ ...prev, status: "active" }));
    }

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ------------------------------
  // IMAGE HANDLERS
  // ------------------------------

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mainImagePreview?.startsWith?.("blob:"))
      URL.revokeObjectURL(mainImagePreview);

    const url = URL.createObjectURL(file);
    setMainImage(file);
    setMainImagePreview(url);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    imagesPreview.forEach((u) => {
      if (u?.startsWith?.("blob:")) URL.revokeObjectURL(u);
    });

    const previewUrls = files.map((f) => URL.createObjectURL(f));
    setImages(files);
    setImagesPreview(previewUrls);
  };

  useEffect(() => {
    return () => {
      if (mainImagePreview?.startsWith?.("blob:"))
        URL.revokeObjectURL(mainImagePreview);
      imagesPreview.forEach((u) => {
        if (u?.startsWith?.("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, [mainImagePreview, imagesPreview]);

  // ------------------------------
  // FETCH CATEGORIES & SHOPS
  // ------------------------------

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const snap = await getDocs(collection(db, "shop"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShops(arr || []);
      } catch (err) {
        console.error("Shop fetch error:", err);
      }
    };
    fetchShops();
  }, []);

  // ------------------------------
  // FETCH PRODUCT IF EDITING
  // ------------------------------

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const product = await getProduct(id);
        if (!product) return;

        setData({
          name: product.name || "",
          price: product.price || "",
          category: product.category || "",
          stock: product.stock || "",
          sku: product.sku || "",
          tags: product.tags?.join(", ") || "",
          description: product.description || "",
          status: product.status || "active",
          mainImageURL: product.mainImageURL || "",
          images: product.images || [],
          shopId: product.shopId || "", // <-- LOAD SHOP ID
        });

        if (product.mainImageURL) setMainImagePreview(product.mainImageURL);
        if (product.images?.length) setImagesPreview(product.images);
      } catch (err) {
        console.error("Product fetch error:", err);
      }
    };

    fetchProduct();
  }, [id]);

  // ------------------------------
  // VALIDATION
  // ------------------------------

  const validateForm = () => {
    const e = {};
    if (!data.name) e.name = "Name is required";
    if (!data.price && data.price !== 0) e.price = "Price is required";
    if (!data.category) e.category = "Category is required";
    if (!data.shopId) e.shopId = "Shop selection is required";
    if (data.stock === "" || data.stock === null) e.stock = "Stock is required";
    if (!mainImage && !data.mainImageURL)
      e.mainImage = "Main image is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ------------------------------
  // UPLOAD IMAGE
  // ------------------------------

  const uploadToStorage = async (file, path) => {
    if (!file) return null;
    const fileRef = ref(storage, `product/${path}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // ------------------------------
  // SUBMIT FORM
  // ------------------------------

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) {
      alert("You must be signed in to save a product.");
      return;
    }

    setIsLoading(true);
    try {
      const mainImageURL = mainImage
        ? await uploadToStorage(mainImage, "main")
        : data.mainImageURL;

      const galleryImages = await Promise.all(
        images.map((f) => uploadToStorage(f, "gallery"))
      );

      const finalStatus = Number(data.stock) === 0 ? "out_of_stock" : "active";

      const finalData = {
        ...data,
        mainImageURL,
        images: [...(data.images || []), ...galleryImages.filter(Boolean)],
        tags: data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),

        price: Number(data.price),
        stock: Number(data.stock),
        status: finalStatus,
        updatedAt: Date.now(),
      };

      if (id) {
        await UpdateProduct({ data: { id, ...finalData } });
      } else {
        await createNewProduct({ data: finalData });
      }

      router.push("/shop/products");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save product.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------
  // UI STARTS HERE
  // ------------------------------------------------

  return (
    <div className="flex-1 flex flex-col gap-5 p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {id ? "Update" : "Create"} Product
        </h1>
        <Link href="/shop/products">
          <button className="text-sm px-3 py-1 border rounded">
            Back to products
          </button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* LEFT */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow flex flex-col gap-4">
          <h2 className="font-semibold text-lg border-b pb-2">Basic Details</h2>

          <Input
            label="Product Name"
            value={data.name}
            error={errors.name}
            onChange={(e) => handleData("name", e.target.value)}
          />

          <Input
            label="Price"
            type="number"
            value={data.price}
            error={errors.price}
            onChange={(e) => handleData("price", e.target.value)}
          />

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label>Category</label>
            <select
              className="border rounded px-3 py-2"
              value={data.category}
              onChange={(e) => handleData("category", e.target.value)}
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm">{errors.category}</p>
            )}
          </div>

          {/* NEW SHOP DROPDOWN */}
          <div className="flex flex-col gap-1">
            <label>Shop</label>
            <select
              className="border rounded px-3 py-2"
              value={data.shopId}
              onChange={(e) => handleData("shopId", e.target.value)}
            >
              <option value="">Select Shop...</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.shopId && (
              <p className="text-red-500 text-sm">{errors.shopId}</p>
            )}
          </div>

          <Input
            label="Stock"
            type="number"
            value={data.stock}
            error={errors.stock}
            onChange={(e) => handleData("stock", e.target.value)}
          />

          <Input
            label="SKU"
            value={data.sku}
            onChange={(e) => handleData("sku", e.target.value)}
          />

          <Input
            label="Tags"
            placeholder="comma separated"
            value={data.tags}
            onChange={(e) => handleData("tags", e.target.value)}
          />

          <input type="hidden" value={data.status} />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded shadow flex flex-col gap-4">
            <h2 className="font-semibold text-lg border-b pb-2">Images</h2>

            <div className="flex flex-col gap-2">
              <label>Main Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="border rounded px-3 py-2"
              />

              {errors.mainImage && (
                <p className="text-red-500 text-sm">{errors.mainImage}</p>
              )}

              {mainImagePreview && (
                <img
                  src={mainImagePreview}
                  alt="main preview"
                  className="w-28 h-28 rounded object-cover mt-2"
                />
              )}
            </div>

            {/* Gallery */}
            <div className="flex flex-col gap-2">
              <label>Gallery Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                className="border rounded px-3 py-2"
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                {(images.length ? imagesPreview : data.images)?.map(
                  (url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`gallery-${i}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold text-lg border-b pb-2">Description</h2>
            <textarea
              className="border rounded px-3 py-2 w-full"
              rows={6}
              value={data.description}
              onChange={(e) => handleData("description", e.target.value)}
            />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="col-span-full flex gap-4 mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {isLoading ? "Saving..." : id ? "Update Product" : "Create Product"}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => router.push("/shop/products")}
            className="bg-gray-300 px-6 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label>{label}</label>
      <input
        {...props}
        className={`border rounded px-3 py-2 w-full ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
