
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Image, Video, FileKey } from "lucide-react";
import { Link } from "react-router-dom";

// Additional product packages
const additionalPackages = [
  {
    name: "Annual Account Access",
    price: "60,000 Ks / Year",
    icon: <FileKey className="h-8 w-8 text-brand-purple" />,
    description: "Full access to YoteShin AI for a year",
    buttonText: "Get Annual Access",
    buttonLink: "/buy-account"
  },
  {
    name: "100 Pro Image Generations",
    price: "20,000 Ks",
    icon: <Image className="h-8 w-8 text-brand-purple" />,
    description: "Generate 100 high-quality AI images",
    buttonText: "Buy Now",
    buttonLink: "/buy-credits"
  },
  {
    name: "20 Pro Video Generations",
    price: "25,000 Ks",
    icon: <Video className="h-8 w-8 text-brand-purple" />,
    description: "Generate 20 high-quality AI videos",
    buttonText: "Buy Now",
    buttonLink: "/buy-credits"
  }
];

const Pricing = () => {
  return (
    <section className="py-16 md:py-24 bg-black">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-300 max-w-3xl mx-auto">
            Choose the option that's right for you and start creating amazing content with YoteShin AI.
          </p>
        </div>
        
        {/* Buy Account and Add Credits Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
              Buy Account and Add Credits
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              Get full access to YoteShin AI or purchase additional credits for your account.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {additionalPackages.map((pkg) => (
              <Card key={pkg.name} className="border border-slate-700 bg-slate-900/50 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">{pkg.name}</CardTitle>
                      <div className="mt-2 text-2xl font-bold text-brand-purple">{pkg.price}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-full">
                      {pkg.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-slate-300">{pkg.description}</p>
                </CardContent>
                <CardFooter>
                  <Link to={pkg.buttonLink} className="w-full">
                    <Button 
                      className="w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
                    >
                      {pkg.buttonText}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="mt-16 bg-slate-900/70 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-3">Payment Information</h3>
          <p className="text-slate-300 mb-4">
            We accept the following payment methods for customers in Myanmar:
          </p>
          <div className="grid gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="font-medium text-white mb-1">KBZ Pay</p>
              <div className="text-sm text-slate-300">
                <p>Account: 09974902335</p>
                <p>Name: Yan Naing Soe</p>
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="font-medium text-white mb-1">Wave Pay</p>
              <div className="text-sm text-slate-300">
                <p>Account: 09969609655</p>
                <p>Name: Su Shwe Sin Win</p>
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="font-medium text-white mb-1">Bangkok Bank</p>
              <div className="text-sm text-slate-300">
                <p>Account: 1494154519</p>
                <p>Name: Yan Naing Soe</p>
                <p className="text-xs italic mt-1">Price will be automatically converted to Thai Baht</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/buy-credits">
              <Button className="bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90">
                Purchase Credits Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
