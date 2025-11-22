"use client";

import { auth, db } from "@/lib/firestore/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);

    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: photo ? URL.createObjectURL(photo) : null,
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: "user",
        photoURL: photo ? URL.createObjectURL(photo) : null,
        createdAt: new Date().toISOString(),
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("You are already registered. Please go login.");
      } else {
        setErrorMsg(error.message);
      }
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignUp}
        className="bg-white flex flex-col gap-5 p-6 rounded-xl shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Sign Up</h2>

        {photoPreview && (
          <div className="flex items-center justify-center">
            <img
              src={photoPreview}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="border-b p-2 w-full focus:outline-none"
          disabled={loading}
        />

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-b p-2 w-full focus:outline-none"
          disabled={loading}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-b p-2 w-full focus:outline-none"
          disabled={loading}
        />

        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-b p-2 w-full focus:outline-none pr-10"
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold transition 
                        ${
                          loading
                            ? "bg-green-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <Link
          href="/login"
          className="text-center text-blue-600 hover:underline"
        >
          Already have an account? Login
        </Link>
      </form>
    </div>
  );
}
