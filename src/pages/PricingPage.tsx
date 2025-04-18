
import React from "react";
import Pricing from "@/components/Pricing";
import Header from "@/components/Header";

const PricingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      
      <main className="flex-1 mt-16">
        <Pricing />
      </main>
      
      <footer className="py-6 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
