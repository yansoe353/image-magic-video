
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import Examples from "./pages/Examples";
import TextToImage from "./components/TextToImage";
import { AIAssistant } from "./components/AIAssistant";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card";
import ImageToVideo from "./components/ImageToVideo";
import StoryToVideo from "./components/StoryToVideo";
import VideoToVideo from "./components/VideoToVideo";
import BuyAccount from "./pages/BuyAccount";
import UserGallery from "./pages/UserGallery";
import BuyCredits from "./pages/BuyCredits";
import UserList from "./components/UserList";
import UserLimits from "./components/UserLimits";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import { isAdmin } from "./utils/authUtils";
import { Users } from "lucide-react";

function App() {
  const [session, setSession] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const checkAdminStatus = async () => {
      const admin = await isAdmin();
      setIsAdminUser(admin);
    };
    checkAdminStatus();
  }, []);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return session ? children : <Login />;
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/examples" element={<Examples />} />
      <Route path="/buy-credits" element={<BuyCredits />} />
      <Route path="/users" element={
        <ProtectedRoute>
          <UserList />
        </ProtectedRoute>
      } />
      <Route path="/user-limits/:userId" element={
        <ProtectedRoute>
          <UserLimits />
        </ProtectedRoute>
      } />
      <Route path="/add-user" element={
        <ProtectedRoute>
          <AddUser />
        </ProtectedRoute>
      } />
      <Route path="/edit-user/:userId" element={
        <ProtectedRoute>
          <EditUser />
        </ProtectedRoute>
      } />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <div className="container mx-auto">
              <div className="flex py-4">
                <Header />
              </div>
              
              <div className="py-8">
                <Tabs defaultValue="text-to-image">
                  <TabsList>
                    <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
                    <TabsTrigger value="text-to-video">Text to Video</TabsTrigger>
                    <TabsTrigger value="story-to-video">Story to Video</TabsTrigger>
                    <TabsTrigger value="img-to-video">Image to Video</TabsTrigger>
                    <TabsTrigger value="video-to-video">Video to Video</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text-to-image" className="py-4">
                    <TextToImage onImageGenerated={() => {}} />
                  </TabsContent>
                  
                  <TabsContent value="text-to-video" className="py-4">
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-6">
                          <AIAssistant />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="story-to-video" className="py-4">
                    <StoryToVideo />
                  </TabsContent>
                  
                  <TabsContent value="img-to-video" className="py-4">
                    <ImageToVideo />
                  </TabsContent>
                  
                  <TabsContent value="video-to-video" className="py-4">
                    <VideoToVideo />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/gallery" element={<UserGallery />} />
      <Route path="/buy-account" element={<BuyAccount />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
