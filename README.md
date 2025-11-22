
# SuperMall – Multi-Vendor Shopping Platform

SuperMall is a modern multi-vendor shopping platform where users can browse products by floor, shop and category. It includes a shop panel for sellers and an admin panel for complete management. Built using Next.js (App Router), Firebase, Tailwind CSS and Context API.



## Features

- Browse by Category
- Browse by Floor
- Browse Shop-wise
- Add to Cart
- Checkout System
- Order History
- Order Details Modal
- User Profile
- Firebase Auth
- Photo Upload
- Admin Dashboard
- Shop Owner Dashboard
- Add/Edit/Delete Products
- Discount / Offers
- Stock Management



## Tech Stack

Next.js (App Router)
React
Tailwind CSS
Firebase Firestore
Firebase Auth
Firebase Storage
Context API
Lucide Icons



## Installation

git clone https://github.com/mahiman1506/supermall.git
cd supermall
npm install
npm run dev

    
## Environment Variables

Create a file named: .env.local

Add the following:

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=



## Folder Structure

app/
├── admin/
├── shop/
├── cart/
├── orders/
├── category/[id]/
├── floor/[id]/
components/
contexts/
lib/firestore/
public/
