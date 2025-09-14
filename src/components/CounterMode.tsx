import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CounterModeProps {
  shopId?: string;
  onClose?: () => void;
}

export function CounterMode({ shopId = 'default-shop', onClose }: CounterModeProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">🏪 Counter Mode</h1>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                ✕ Close
              </Button>
            )}
          </div>
          <p className="text-lg text-gray-600">Shop ID: {shopId}</p>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">Scan Tickets</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan Customer Ticket</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  size="lg" 
                  className="mb-4"
                  onClick={() => alert('QR Scanner would open here')}
                >
                  📱 Scan QR Code
                </Button>
                <p className="text-gray-600">
                  Point camera at customer's diagnosis ticket QR code
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-gray-600">Total Referrals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">2</p>
                    <p className="text-sm text-gray-600">This Month</p>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => alert('Referral QR would be shared')}
                >
                  📤 Share Referral QR
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">3</p>
                    <p className="text-sm text-gray-600">Active Coupons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">1</p>
                    <p className="text-sm text-gray-600">Used Today</p>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => alert('Coupon printer would open')}
                >
                  🖨️ Print Coupon
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}