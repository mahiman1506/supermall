// "use client"
// import { useAuth } from "@/contexts/AuthContext";
// import Link from "next/link";

// export default function Page() {

//     const { role } = useAuth();

//     return (
//         <div>
//             <h1>User Dashboard</h1>
//             <Link href={"/"}>
//                 <h1>Home</h1>
//             </Link>
//             {role === "admin" ? (
//                 <Link href="/admin">
//                     <h1>Admin panel</h1>
//                 </Link>
//             ) : (
//                 <Link className="hidden " href="/admin">
//                     <h1>Admin panel</h1>
//                 </Link>
//             )}

//             {role === "shop" ? (
//                 <Link href={"/shop"}>
//                     <h1>Shop panel</h1>
//                 </Link>
//             ) : (
//                 <Link className="hidden " href={"/shop"}>
//                     <h1>Shop panel</h1>
//                 </Link>
//             )}

//         </div>
//     )
// }

"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Page() {
  const { role, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-14 px-4">
      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Manage your account & tools
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-10">
        {/* USER INFO */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold">
            Hi, {user?.displayName || "User"} 👋
          </h2>
          <p className="text-gray-600 mt-1">
            Role: <span className="font-medium">{role}</span>
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-4">
          {/* Home */}
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl text-lg font-medium text-center shadow-md"
          >
            🏠 Go to Homepage
          </Link>

          {/* ADMIN */}
          {role === "admin" && (
            <Link
              href="/admin"
              className="bg-black hover:bg-gray-900 text-white px-6 py-4 rounded-xl text-lg font-medium text-center shadow-md"
            >
              🛠 Admin Panel
            </Link>
          )}

          {/* SHOP */}
          {role === "shop" && (
            <Link
              href="/shop"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl text-lg font-medium text-center shadow-md"
            >
              🏪 Shop Panel
            </Link>
          )}

          {/* USER ORDERS */}
          {role === "user" && (
            <Link
              href="/orders"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl text-lg font-medium text-center shadow-md"
            >
              📦 My Orders
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
