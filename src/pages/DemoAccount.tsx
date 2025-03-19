
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Clock, Sparkles, FileLock, ImageIcon, VideoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DemoAccount = () => {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    navigate("/create");
  };
  
  const handleBuyAccount = () => {
    navigate("/buy-account");
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Try YoteShin AI Demo</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Experience the power of YoteShin AI with our limited demo account. No credit card required.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-center">Demo Account</CardTitle>
            <CardDescription className="text-center text-lg font-semibold">
              Free
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Sparkles className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span>Try basic video generation features</span>
              </li>
              <li className="flex items-start">
                <ImageIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span>Limited to 3 image generations</span>
              </li>
              <li className="flex items-start">
                <VideoIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span>Limited to 1 video generation</span>
              </li>
              <li className="flex items-start">
                <FileLock className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span>Demo watermark on all videos</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
              onClick={handleTryDemo}
            >
              Try Demo Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <div className="flex flex-col justify-center space-y-6">
          <h2 className="text-2xl font-bold">Want unlimited access?</h2>
          <p className="text-slate-700">
            Upgrade to a Premium account to unlock all features, including:
          </p>
          <ul className="space-y-2 ml-2">
            <li className="flex items-center">
              <ImageIcon className="h-5 w-5 text-brand-purple mr-2" />
              <span><strong>100</strong> image generations</span>
            </li>
            <li className="flex items-center">
              <VideoIcon className="h-5 w-5 text-brand-purple mr-2" />
              <span><strong>50</strong> video generations</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>No watermarks</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Priority support</span>
            </li>
          </ul>
          <Button 
            size="lg" 
            onClick={handleBuyAccount}
            className="w-fit"
          >
            Buy Premium Account
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How the Demo Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-purple text-white rounded-full flex items-center justify-center mb-4">1</div>
            <h3 className="text-lg font-semibold mb-2">Create an Account</h3>
            <p className="text-slate-600">No credit card required. Just sign up with your email.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-purple text-white rounded-full flex items-center justify-center mb-4">2</div>
            <h3 className="text-lg font-semibold mb-2">Try the Features</h3>
            <p className="text-slate-600">Experiment with our AI tools to create amazing videos.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-purple text-white rounded-full flex items-center justify-center mb-4">3</div>
            <h3 className="text-lg font-semibold mb-2">Upgrade Anytime</h3>
            <p className="text-slate-600">Love what you see? Upgrade to a Premium account for unlimited access.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoAccount;
