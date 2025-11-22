"use client";

import { auth, db } from "@/lib/firestore/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.exists() ? userDoc.data() : null;
      const role = data?.role ?? "user";

      if (role === "admin") router.push("/admin");
      else if (role === "shop") router.push("/shop");
      else router.push("/dashboard");
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        setErrorMsg("You are NOT registered. Please go Sign Up.");
      } else {
        setErrorMsg(error.message);
      }
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white flex flex-col gap-5 p-6 rounded-xl shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

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

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold transition 
                        ${
                          loading
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }
                    `}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex gap-5 items-center justify-center">
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
          <Link
            href="/forgotpassword"
            className="text-blue-900 hover:underline"
          >
            Forgot Password
          </Link>
        </div>
      </form>
    </div>
  );
}
