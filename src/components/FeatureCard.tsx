
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Image, Video, Edit, BookOpen } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, link }) => {
  const getIcon = () => {
    switch (icon) {
      case "image":
        return <Image className="h-16 w-16 text-purple-400 opacity-80" />;
      case "video":
        return <Video className="h-16 w-16 text-blue-400 opacity-80" />;
      case "edit":
        return <Edit className="h-16 w-16 text-green-400 opacity-80" />;
      case "book":
        return <BookOpen className="h-16 w-16 text-amber-400 opacity-80" />;
      default:
        return <Image className="h-16 w-16 text-purple-400 opacity-80" />;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700 hover:border-brand-600 transition-colors">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-44 bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-md flex items-center justify-center">
          {getIcon()}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={link} className="w-full">
          <Button variant="secondary" className="w-full">
            Try Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FeatureCard;
