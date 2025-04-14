
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Image, Video, FileKey } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For casual users",
    features: [
      "5 image generations per day",
      "2 video generations per day",
      "Standard resolution",
      "Basic editing tools",
      "Access to public gallery"
    ],
    buttonText: "Get Started",
    buttonLink: "/create",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "monthly",
    description: "For professionals and creators",
    features: [
      "Unlimited image generations",
      "20 video generations per day",
      "HD resolution",
      "Advanced editing tools",
      "Priority rendering",
      "Story to video generation",
      "Email support"
    ],
    buttonText: "Upgrade to Pro",
    buttonLink: "/buy-account",
    highlighted: true
  },
  {
    name: "Premium",
    price: "$49.99",
    period: "monthly",
    description: "For serious creators",
    features: [
      "Everything in Pro",
      "Unlimited video generations",
      "4K resolution",
      "Advanced AI story generation",
      "Commercial usage rights",
      "Dedicated account manager",
      "24/7 priority support"
    ],
    buttonText: "Get Premium",
    buttonLink: "/buy-account",
    highlighted: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For businesses and teams",
    features: [
      "Unlimited generations",
      "4K resolution",
      "API access",
      "Brand customization",
      "Dedicated support",
      "Team collaboration"
    ],
    buttonText: "Contact Sales",
    buttonLink: "/contact",
    highlighted: false
  }
];

// Additional product packages
const additionalPackages = [
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
  },
  {
    name: "Annual Account Access",
    price: "60,000 Ks",
    icon: <FileKey className="h-8 w-8 text-brand-purple" />,
    description: "Full access to YoteShin AI for a year",
    buttonText: "Get Annual Access",
    buttonLink: "/buy-account"
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
            Choose the plan that's right for you and start creating amazing content with YoteShin AI.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`border ${
                plan.highlighted 
                  ? "border-brand-500 bg-gradient-to-b from-slate-900 to-slate-950" 
                  : "border-slate-700 bg-slate-900/50"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  {plan.name === "Premium" && <Zap className="h-5 w-5 text-yellow-400" />}
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-2 text-sm text-slate-400">/{plan.period}</span>
                  )}
                </div>
                <CardDescription className="mt-3">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300">
                      <Check className="h-4 w-4 mr-3 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link to={plan.buttonLink} className="w-full">
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? "bg-brand-600 hover:bg-brand-500" 
                        : plan.name === "Premium"
                          ? "bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400" 
                          : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Additional Credits/Packages Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
              Add More Credits
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              Need more generation capacity? Purchase additional credits for your account.
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
            We currently accept the following payment methods for customers in Myanmar:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <p className="font-medium text-white">KBZ Pay</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <p className="font-medium text-white">Wave Pay</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <p className="font-medium text-white">Bank Transfer</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <p className="font-medium text-white">Cash Payment</p>
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
