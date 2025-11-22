"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgePercentIcon,
  Building2Icon,
  BuildingIcon,
  HomeIcon,
  InfoIcon,
  LogOutIcon,
  Menu,
  PhoneIcon,
  SettingsIcon,
  ShoppingCartIcon,
  StoreIcon,
  TagsIcon,
  UserIcon,
  X,
} from "lucide-react";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { app, storage } from "@/lib/firestore/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories } from "@/lib/firestore/categories/read_server";
import Link from "next/link";
import { getFloor } from "@/lib/firestore/floors/read_server";
import { useCart } from "@/contexts/CartContext";
import { usePathname } from "next/navigation";

export default function UserHeader() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [floor, setFloor] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  const { cartCount } = useCart();
  const auth = getAuth(app);
  const { role } = useAuth();

  const userRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    getFloor().then(setFloor).catch(console.error);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "No Name",
          email: currentUser.email,
          photoURL: currentUser.photoURL || null,
        });
      } else setUser(null);
    });
    return () => unsub();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);

    try {
      const fileRef = storageRef(
        storage,
        `profileImages/${auth.currentUser.uid}/${file.name}`
      );
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setUser((prev) => ({ ...prev, photoURL: downloadURL }));
    } catch (error) {
      console.error(error);
    }

    setUploading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
  };

  const handleNameUpdate = async () => {
    if (auth.currentUser && newName.trim()) {
      await updateProfile(auth.currentUser, { displayName: newName });
      setUser((prev) => ({ ...prev, name: newName }));
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userRef.current &&
        !userRef.current.contains(e.target) &&
        settingsRef.current &&
        !settingsRef.current.contains(e.target)
      ) {
        setShowUserInfo(false);
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuList = [
    { id: 1, name: "Home", link: "/" },
    { id: 2, name: "Store", link: "/store" },
    { id: 3, name: "Category", link: "" },
    { id: 4, name: "Floor", link: "/floor" },
    { id: 5, name: "Offers", link: "/offers" },
    { id: 6, name: "About", link: "/about" },
    { id: 7, name: "Contact Us", link: "/contact-us" },
  ];

  return (
    <header className="fixed top-0 left-0 z-50 bg-gradient-to-r from-indigo-600 to-blue-700 flex items-center justify-between p-4 w-full">
      {/* LOGO */}
      <div className="flex items-center gap-3">
        <BuildingIcon className="h-10 w-10 text-white" />
        <span className="font-semibold text-2xl text-white">Super Mall</span>
      </div>

      {/* DESKTOP MENU */}
      <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
        {menuList.map((item) => (
          <div key={item.id} className="relative">
            {/* CATEGORY */}
            {item.name === "Category" && (
              <>
                <button
                  onClick={() => {
                    setShowCategoryDropdown((p) => !p);
                    setShowFloorDropdown(false);
                  }}
                  className={`font-semibold ${
                    pathname.startsWith("/category")
                      ? "text-yellow-300 font-bold underline"
                      : "text-white"
                  }`}
                >
                  Category
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg p-2 min-w-[200px] z-50">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.id}`}
                        className={`block px-3 py-2 rounded-md hover:bg-gray-100 ${
                          pathname === `/category/${cat.id}`
                            ? "bg-gray-200 font-bold"
                            : ""
                        }`}
                        onClick={() => setShowCategoryDropdown(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* FLOOR */}
            {item.name === "Floor" && (
              <>
                <button
                  onClick={() => {
                    setShowFloorDropdown((p) => !p);
                    setShowCategoryDropdown(false);
                  }}
                  className={`font-semibold ${
                    pathname.startsWith("/floor")
                      ? "text-yellow-300 font-bold underline"
                      : "text-white"
                  }`}
                >
                  Floor
                </button>

                {showFloorDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg p-2 min-w-[200px] z-50">
                    {floor.map((f) => (
                      <Link
                        key={f.id}
                        href={`/floor/${f.id}`}
                        className={`block px-3 py-2 rounded-md hover:bg-gray-100 ${
                          pathname === `/floor/${f.id}`
                            ? "bg-gray-200 font-bold"
                            : ""
                        }`}
                        onClick={() => setShowFloorDropdown(false)}
                      >
                        {f.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* REGULAR MENU ITEMS */}
            {item.name !== "Category" && item.name !== "Floor" && (
              <Link
                href={item.link}
                className={`${
                  pathname === item.link
                    ? "text-yellow-300 font-bold underline"
                    : "text-white"
                } hover:underline`}
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}

        {/* ADMIN */}
        {role === "admin" && (
          <Link
            href="/admin"
            className={`${
              pathname.startsWith("/admin")
                ? "text-yellow-300 font-bold underline"
                : "text-white"
            }`}
          >
            Admin Panel
          </Link>
        )}

        {/* SHOP */}
        {role === "shop" && (
          <Link
            href="/shop"
            className={`${
              pathname.startsWith("/shop")
                ? "text-yellow-300 font-bold underline"
                : "text-white"
            }`}
          >
            Shop Panel
          </Link>
        )}
      </nav>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        {/* DESKTOP CART */}
        <div className="hidden md:flex relative">
          <Link href="/cart">
            <ShoppingCartIcon className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* USER (DESKTOP) */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div ref={userRef} className="relative">
                <button onClick={() => setShowUserInfo((p) => !p)}>
                  <UserIcon className="h-6 w-6 text-white cursor-pointer" />
                </button>

                {showUserInfo && (
                  <div className="absolute right-0 top-12 w-64 bg-white shadow-lg rounded-xl p-4 z-50">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex justify-center items-center font-bold">
                          {user.name?.charAt(0)}
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setNewName(user.name);
                        }}
                        className="text-sm mt-3 underline text-blue-600"
                      >
                        Edit Name
                      </button>
                    ) : (
                      <>
                        <input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="border p-2 w-full rounded mt-2"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 bg-gray-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleNameUpdate}
                            className="px-3 py-1 bg-green-600 text-white rounded"
                          >
                            Save
                          </button>
                        </div>
                      </>
                    )}

                    <label className="mt-3 underline cursor-pointer block">
                      Change Photo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div ref={settingsRef} className="relative">
                <button onClick={() => setShowLogout((p) => !p)}>
                  <SettingsIcon className="h-6 w-6 text-white cursor-pointer" />
                </button>

                {showLogout && (
                  <div className="absolute right-0 top-12 bg-white shadow-md rounded-lg p-2 w-40">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-blue-600 font-medium"
                      onClick={() => setShowLogout(false)}
                    >
                      <HomeIcon className="h-5 w-5" />
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center text-red-500 gap-2 px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      <LogOutIcon className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold">
                Login
              </button>
            </Link>
          )}
        </div>

        {/* MOBILE CART */}
        <div className="md:hidden mr-2">
          <Link href="/cart">
            <button className="relative">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-2/3 bg-indigo-700 text-white p-6 z-[60] transform transition-all ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex gap-2">
            <BuildingIcon className="h-8 w-8" /> Super Mall
          </h2>
          <X className="cursor-pointer" onClick={() => setIsOpen(false)} />
        </div>

        {/* USER BOX */}
        {user && (
          <div className="bg-slate-700 rounded-xl p-4 mb-4">
            <div className="flex flex-col items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-300 rounded-full flex justify-center items-center font-bold text-gray-700">
                  {user.name?.charAt(0)}
                </div>
              )}

              {!isEditing ? (
                <>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-300">{user.email}</p>
                </>
              ) : (
                <>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border p-2 w-full rounded text-black"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 text-black px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNameUpdate}
                      className="bg-green-600 px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  </div>
                </>
              )}

              <label className="mt-3 underline cursor-pointer">
                Change Photo
                <input
                  type="file"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </div>
        )}

        {/* MOBILE MENU */}
        <nav className="flex flex-col gap-4">
          {/* CATEGORY */}
          <div>
            <button
              onClick={() => {
                setShowCategoryDropdown((p) => !p);
                setShowFloorDropdown(false);
              }}
              className={`flex justify-between w-full text-lg ${
                pathname.startsWith("/category")
                  ? "text-yellow-300 font-bold underline"
                  : ""
              }`}
            >
              Category {showCategoryDropdown ? "▲" : "▼"}
            </button>

            {showCategoryDropdown && (
              <div className="ml-4 mt-2 flex flex-col">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className={`py-1 underline ${
                      pathname === `/category/${cat.id}`
                        ? "text-yellow-300 font-bold"
                        : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* FLOOR */}
          <div>
            <button
              onClick={() => {
                setShowFloorDropdown((p) => !p);
                setShowCategoryDropdown(false);
              }}
              className={`flex justify-between w-full text-lg ${
                pathname.startsWith("/floor")
                  ? "text-yellow-300 font-bold underline"
                  : ""
              }`}
            >
              Floor {showFloorDropdown ? "▲" : "▼"}
            </button>

            {showFloorDropdown && (
              <div className="ml-4 mt-2 flex flex-col">
                {floor.map((f) => (
                  <Link
                    key={f.id}
                    href={`/floor/${f.id}`}
                    className={`py-1 underline ${
                      pathname === `/floor/${f.id}`
                        ? "text-yellow-300 font-bold"
                        : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {f.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* NORMAL ITEMS */}
          {menuList
            .filter((m) => m.name !== "Category" && m.name !== "Floor")
            .map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`text-lg underline ${
                  pathname === item.link ? "text-yellow-300 font-bold" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

          {/* ADMIN */}
          {role === "admin" && (
            <Link
              href="/admin"
              className={`text-lg underline ${
                pathname.startsWith("/admin") ? "text-yellow-300 font-bold" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Admin Panel
            </Link>
          )}

          {/* SHOP */}
          {role === "shop" && (
            <Link
              href="/shop"
              className={`text-lg underline ${
                pathname.startsWith("/shop") ? "text-yellow-300 font-bold" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Shop Panel
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-2 rounded mt-4 flex items-center gap-2"
            >
              <LogOutIcon className="h-5 w-5" /> Logout
            </button>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-3 py-2 rounded mt-4">
                Login
              </button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
