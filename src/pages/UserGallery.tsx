
import { useState } from "react";
import Header from "@/components/Header";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const UserGallery = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      
      <main className="flex-1 container max-w-7xl py-8 px-4 md:px-6 mt-16">
        <section className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-4">
            User Gallery
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-6">
            Explore public AI-generated images and videos created by our community
          </p>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
        </section>

        <section>
          <GalleryGrid />
        </section>
      </main>
      
      <footer className="py-6 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default UserGallery;
