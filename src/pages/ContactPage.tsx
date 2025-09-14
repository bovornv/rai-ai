import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90">Get in touch with our team</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Your name" />
              <Input placeholder="Your email" type="email" />
              <Textarea placeholder="Your message" rows={5} />
              <Button className="w-full">Send Message</Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button 
              onClick={() => window.history.back()}
              size="lg"
              variant="outline"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
