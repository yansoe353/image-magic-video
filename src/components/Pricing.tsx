
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
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

const additionalPacks = [
  {
    name: "Extra Image Pack",
    price: "20,000 Ks",
    description: "Extend your creative capabilities",
    features: [
      "100 additional image generations",
      "No expiration date",
      "Pro quality output",
      "Same-day activation"
    ],
    buttonText: "Buy Images Pack",
    buttonLink: "/buy-credits"
  },
  {
    name: "Extra Video Pack",
    price: "25,000 Ks",
    description: "Bring more stories to life",
    features: [
      "20 additional video generations",
      "No expiration date", 
      "HD video quality",
      "Priority processing"
    ],
    buttonText: "Buy Videos Pack",
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

        {/* Additional Generation Packs */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
              Need Extra Generation Credits?
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              Extend your creative possibilities with these additional generation packs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {additionalPacks.map((pack) => (
              <Card 
                key={pack.name} 
                className="border border-emerald-600/30 bg-gradient-to-b from-slate-900 to-slate-950"
              >
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{pack.name}</CardTitle>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold text-emerald-400">{pack.price}</span>
                  </div>
                  <CardDescription className="mt-3">{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex items-center text-slate-300">
                        <Check className="h-4 w-4 mr-3 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to={pack.buttonLink} className="w-full">
                    <Button 
                      className="w-full bg-emerald-700 hover:bg-emerald-600"
                    >
                      {pack.buttonText}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
