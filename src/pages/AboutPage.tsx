import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About RaiAI</h1>
          <p className="text-xl opacity-90">Revolutionizing farming in Thailand with AI</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700">
                RaiAI empowers Thai farmers with cutting-edge AI technology to diagnose crop diseases, 
                track market prices, and make informed decisions for better yields.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700">
                Built with React, TypeScript, and advanced machine learning models trained specifically 
                for Thai crops like rice and durian.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-lg text-gray-700 space-y-2">
                <li>• AI-powered crop disease diagnosis</li>
                <li>• Real-time market price tracking</li>
                <li>• Digital shop ticket system</li>
                <li>• Hyperlocal outbreak alerts</li>
                <li>• Offline functionality</li>
                <li>• Referral rewards system</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={() => window.history.back()}
              size="lg"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
