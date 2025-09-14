import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateShareCard } from '../lib/share-cards';

interface ShopTicketData {
  id: string;
  crop: 'rice' | 'durian';
  diagnosis: string;
  severity: 'low' | 'moderate' | 'high';
  recommendedClasses: string[];
  dosageNote?: string;
  rai: number;
  status: 'issued' | 'scanned' | 'fulfilled' | 'expired' | 'canceled';
  createdAt: string;
  expiresAt: string;
  shopId?: string;
  qrCode: string;
}

interface ShopTicketProps {
  ticketData: ShopTicketData;
  onPrint?: () => void;
  onShare?: () => void;
}

export function ShopTicket({ ticketData, onPrint, onShare }: ShopTicketProps) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();
      const expiresAt = new Date(ticketData.expiresAt);
      setIsExpired(now > expiresAt);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [ticketData.expiresAt]);

  const handlePrint = async () => {
    try {
      // TODO: Implement actual printing logic
      // This could use a printing library or send to a print service
      alert('Ticket sent to printer');
      onPrint?.();
    } catch (error) {
      console.error('Failed to print ticket:', error);
      alert('Failed to print ticket');
    }
  };

  const handleShare = async () => {
    try {
      const shareCard = generateShareCard('shopTicket', ticketData);
      
      if (navigator.share) {
        await navigator.share({
          title: 'RaiAI Shop Ticket',
          text: `Diagnosis ticket for ${ticketData.crop}`,
          url: shareCard.url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareCard.url);
        alert('Ticket URL copied to clipboard');
      }
      
      onShare?.();
    } catch (error) {
      console.error('Failed to share ticket:', error);
      alert('Failed to share ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'scanned': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">🌾 RaiAI Shop Ticket</h2>
          <Badge className={getStatusColor(ticketData.status)}>
            {ticketData.status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm opacity-90 mt-1">Ticket ID: {ticketData.id}</p>
      </div>

      {/* QR Code */}
      <div className="p-6 text-center">
        <div className="bg-gray-100 p-4 rounded-lg inline-block">
          <div className="w-32 h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-500 text-sm">QR Code</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Scan at agri-shop</p>
      </div>

      {/* Ticket Details */}
      <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Crop</p>
            <p className="font-semibold capitalize">{ticketData.crop}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Area</p>
            <p className="font-semibold">{ticketData.rai} rai</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Diagnosis</p>
          <p className="font-semibold">{ticketData.diagnosis}</p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">Severity:</p>
          <Badge className={getSeverityColor(ticketData.severity)}>
            {ticketData.severity.toUpperCase()}
          </Badge>
        </div>

        <div>
          <p className="text-sm text-gray-500">Recommended Products</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {ticketData.recommendedClasses.map((cls, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {cls}
              </Badge>
            ))}
          </div>
        </div>

        {ticketData.dosageNote && (
          <div>
            <p className="text-sm text-gray-500">Dosage Notes</p>
            <p className="text-sm">{ticketData.dosageNote}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Created</p>
            <p>{new Date(ticketData.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Expires</p>
            <p className={isExpired ? 'text-red-600' : ''}>
              {new Date(ticketData.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">⚠️ This ticket has expired</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handlePrint}
            className="flex-1"
            disabled={isExpired}
          >
            🖨️ Print
          </Button>
          <Button 
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            📤 Share
          </Button>
        </div>
      </div>
    </div>
  );
}