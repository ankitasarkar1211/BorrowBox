import React from 'react';
import { Link } from 'react-router-dom';
import { PackageX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF8F3] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E8DCCB]/60 flex items-center justify-center mb-5 text-[#542F20]">
        <PackageX className="w-8 h-8" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[#3A2118]">Page not found</h1>
      <p className="mt-2 text-sm text-[#795548]/80 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/marketplace"
        className="mt-6 inline-flex items-center px-5 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition"
      >
        Back to marketplace
      </Link>
    </div>
  );
}
