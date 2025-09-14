import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Droplets, Beaker, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  concentration: number;
  unit: string;
  recommendedDosage: number;
  dosageUnit: string;
}

interface MixingCalculatorProps {
  initialProduct?: Product;
  onCalculate?: (result: MixingResult) => void;
}

interface MixingResult {
  product: string;
  concentration: number;
  tankSize: number;
  dosagePerLiter: number;
  totalAmount: number;
  totalCost: number;
  costPerLiter: number;
}

export function MixingCalculator({ initialProduct, onCalculate }: MixingCalculatorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [tankSize, setTankSize] = useState<number>(20);
  const [dosage, setDosage] = useState<number>(2.5);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [result, setResult] = useState<MixingResult | null>(null);

  const products: Product[] = [
    {
      id: '1',
      name: 'Propiconazole 25% EC',
      concentration: 25,
      unit: '%',
      recommendedDosage: 2.5,
      dosageUnit: 'ml/L'
    },
    {
      id: '2',
      name: 'Mancozeb 80% WP',
      concentration: 80,
      unit: '%',
      recommendedDosage: 2.0,
      dosageUnit: 'g/L'
    },
    {
      id: '3',
      name: 'Copper Oxychloride 50% WP',
      concentration: 50,
      unit: '%',
      recommendedDosage: 3.0,
      dosageUnit: 'g/L'
    },
    {
      id: '4',
      name: 'Chlorothalonil 75% WP',
      concentration: 75,
      unit: '%',
      recommendedDosage: 1.5,
      dosageUnit: 'g/L'
    }
  ];

  const calculateMixing = () => {
    if (!selectedProduct || tankSize <= 0 || dosage <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const totalAmount = dosage * tankSize;
    const totalCost = productPrice > 0 ? (totalAmount * productPrice) : 0;
    const costPerLiter = productPrice > 0 ? (totalCost / tankSize) : 0;

    const mixingResult: MixingResult = {
      product: selectedProduct.name,
      concentration: selectedProduct.concentration,
      tankSize,
      dosagePerLiter: dosage,
      totalAmount,
      totalCost,
      costPerLiter
    };

    setResult(mixingResult);
    onCalculate?.(mixingResult);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setDosage(product.recommendedDosage);
    }
  };

  const getDosageUnit = () => {
    return selectedProduct?.dosageUnit || 'ml/L';
  };

  const getConcentrationWarning = () => {
    if (!selectedProduct) return null;
    
    if (selectedProduct.concentration > 50) {
      return {
        level: 'high',
        message: 'High concentration product - use proper PPE'
      };
    } else if (selectedProduct.concentration > 25) {
      return {
        level: 'medium',
        message: 'Medium concentration - follow safety guidelines'
      };
    }
    return null;
  };

  const warning = getConcentrationWarning();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Mixing Calculator</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Calculate the correct amount of product for your spray tank
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Product
            </label>
            <Select onValueChange={handleProductSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-gray-500">
                        {product.concentration}% • {product.recommendedDosage} {product.dosageUnit}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tank Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tank Size (Liters)
            </label>
            <Input
              type="number"
              value={tankSize}
              onChange={(e) => setTankSize(Number(e.target.value))}
              placeholder="Enter tank size"
              min="1"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Dosage ({getDosageUnit()})
            </label>
            <Input
              type="number"
              step="0.1"
              value={dosage}
              onChange={(e) => setDosage(Number(e.target.value))}
              placeholder="Enter dosage"
              min="0.1"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">
                Recommended: {selectedProduct.recommendedDosage} {selectedProduct.dosageUnit}
              </p>
            )}
          </div>

          {/* Product Price (Optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Product Price (฿ per {getDosageUnit().split('/')[0]}) - Optional
            </label>
            <Input
              type="number"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(Number(e.target.value))}
              placeholder="Enter price for cost calculation"
              min="0"
            />
          </div>

          {/* Safety Warning */}
          {warning && (
            <div className={`p-3 rounded-lg border ${
              warning.level === 'high' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-4 w-4 ${
                  warning.level === 'high' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <span className={`text-sm ${
                  warning.level === 'high' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {warning.message}
                </span>
              </div>
            </div>
          )}

          <Button onClick={calculateMixing} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Mixing
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Beaker className="h-5 w-5" />
              <span>Mixing Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Product:</span>
                  <span className="text-sm font-medium">{result.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Concentration:</span>
                  <span className="text-sm font-medium">{result.concentration}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tank Size:</span>
                  <span className="text-sm font-medium">{result.tankSize}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dosage per Liter:</span>
                  <span className="text-sm font-medium">
                    {result.dosagePerLiter} {getDosageUnit()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium">
                    {result.totalAmount.toFixed(1)} {getDosageUnit().split('/')[0]}
                  </span>
                </div>
                {result.totalCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Cost:</span>
                      <span className="text-sm font-medium">
                        ฿{result.totalCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cost per Liter:</span>
                      <span className="text-sm font-medium">
                        ฿{result.costPerLiter.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mixing Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Mixing Instructions:</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Fill tank with {result.tankSize * 0.8}L of water</li>
                <li>2. Add {result.totalAmount.toFixed(1)} {getDosageUnit().split('/')[0]} of {result.product}</li>
                <li>3. Top up with remaining water to {result.tankSize}L</li>
                <li>4. Mix thoroughly before spraying</li>
              </ol>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => navigator.clipboard.writeText(
                  `Mixing: ${result.totalAmount.toFixed(1)} ${getDosageUnit().split('/')[0]} of ${result.product} for ${result.tankSize}L tank`
                )}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Copy Details
              </Button>
              <Button
                onClick={() => setResult(null)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                New Calculation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
