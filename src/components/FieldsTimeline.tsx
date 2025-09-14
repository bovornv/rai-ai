import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Activity,
  MapPin,
  BarChart3,
  Clock
} from "lucide-react";

interface Field {
  id: string;
  name: string;
  location: string;
  area: number; // in rai
  cropType: 'rice' | 'durian';
  plantingDate: string;
  currentStage: string;
  progress: number; // 0-100
}

interface ScanRecord {
  id: string;
  fieldId: string;
  date: string;
  disease: string;
  severity: number;
  treatment: string;
  cost: number;
  result: 'success' | 'partial' | 'failed';
}

interface ROISnapshot {
  fieldId: string;
  period: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  costPerRai: number;
  revenuePerRai: number;
  profitPerRai: number;
  trend: 'up' | 'down' | 'stable';
}

interface FieldsTimelineProps {
  selectedFieldId?: string;
  onFieldSelect?: (fieldId: string) => void;
}

export function FieldsTimeline({ selectedFieldId, onFieldSelect }: FieldsTimelineProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [roiSnapshots, setROISnapshots] = useState<ROISnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFieldsData();
  }, []);

  const fetchFieldsData = async () => {
    try {
      // Mock data - replace with real API calls
      const mockFields: Field[] = [
        {
          id: '1',
          name: 'North Rice Field',
          location: 'Chiang Mai, Thailand',
          area: 2.5,
          cropType: 'rice',
          plantingDate: '2024-01-01',
          currentStage: 'Vegetative Growth',
          progress: 65
        },
        {
          id: '2',
          name: 'South Durian Orchard',
          location: 'Chonburi, Thailand',
          area: 1.8,
          cropType: 'durian',
          plantingDate: '2023-12-15',
          currentStage: 'Flowering',
          progress: 80
        }
      ];

      const mockScans: ScanRecord[] = [
        {
          id: '1',
          fieldId: '1',
          date: '2024-01-10',
          disease: 'Rice Blast',
          severity: 3,
          treatment: 'Propiconazole 25% EC',
          cost: 450,
          result: 'success'
        },
        {
          id: '2',
          fieldId: '1',
          date: '2024-01-15',
          disease: 'Brown Spot',
          severity: 2,
          treatment: 'Copper fungicide',
          cost: 320,
          result: 'partial'
        },
        {
          id: '3',
          fieldId: '2',
          date: '2024-01-12',
          disease: 'Anthracnose',
          severity: 4,
          treatment: 'Mancozeb 80% WP',
          cost: 680,
          result: 'success'
        }
      ];

      const mockROI: ROISnapshot[] = [
        {
          fieldId: '1',
          period: 'Q1 2024',
          totalCost: 12500,
          totalRevenue: 18750,
          profit: 6250,
          costPerRai: 5000,
          revenuePerRai: 7500,
          profitPerRai: 2500,
          trend: 'up'
        },
        {
          fieldId: '2',
          period: 'Q1 2024',
          totalCost: 8900,
          totalRevenue: 12600,
          profit: 3700,
          costPerRai: 4944,
          revenuePerRai: 7000,
          profitPerRai: 2056,
          trend: 'stable'
        }
      ];

      setFields(mockFields);
      setScans(mockScans);
      setROISnapshots(mockROI);
    } catch (error) {
      console.error('Failed to fetch fields data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldScans = (fieldId: string) => {
    return scans.filter(scan => scan.fieldId === fieldId);
  };

  const getFieldROI = (fieldId: string) => {
    return roiSnapshots.find(roi => roi.fieldId === fieldId);
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-500';
    if (severity <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fields Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const fieldScans = getFieldScans(field.id);
          const fieldROI = getFieldROI(field.id);
          
          return (
            <Card 
              key={field.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFieldId === field.id ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => onFieldSelect?.(field.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{field.name}</span>
                  </div>
                  <Badge variant="outline">
                    {field.cropType}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">{field.location}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{field.progress}%</span>
                  </div>
                  <Progress value={field.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {field.currentStage}
                  </p>
                </div>

                {/* ROI Snapshot */}
                {fieldROI && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">ROI Snapshot</h4>
                      {getTrendIcon(fieldROI.trend)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Cost/Rai:</span>
                        <span className="ml-1 font-medium">
                          ฿{fieldROI.costPerRai.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit/Rai:</span>
                        <span className="ml-1 font-medium text-green-600">
                          ฿{fieldROI.profitPerRai.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Scans */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recent Scans</h4>
                  <div className="space-y-2">
                    {fieldScans.slice(0, 2).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`${getSeverityColor(scan.severity)} text-white`}
                          >
                            {scan.severity}
                          </Badge>
                          <span>{scan.disease}</span>
                        </div>
                        <span className={getResultColor(scan.result)}>
                          {scan.result}
                        </span>
                      </div>
                    ))}
                    {fieldScans.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{fieldScans.length - 2} more scans
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Timeline for Selected Field */}
      {selectedFieldId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Field Timeline & ROI</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedField = fields.find(f => f.id === selectedFieldId);
              const fieldScans = getFieldScans(selectedFieldId);
              const fieldROI = getFieldROI(selectedFieldId);
              
              if (!selectedField) return null;
              
              return (
                <div className="space-y-6">
                  {/* Field Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-semibold">
                        ฿{fieldROI?.totalCost.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="font-semibold">
                        ฿{fieldROI?.totalRevenue.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Activity className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm text-gray-600">Profit</p>
                      <p className="font-semibold text-green-600">
                        ฿{fieldROI?.profit.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm text-gray-600">Area</p>
                      <p className="font-semibold">
                        {selectedField.area} rai
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-semibold mb-3">Scan History</h4>
                    <div className="space-y-3">
                      {fieldScans.map((scan) => (
                        <div key={scan.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            <Badge className={getSeverityColor(scan.severity)}>
                              {scan.severity}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{scan.disease}</h5>
                              <span className="text-sm text-gray-500">{scan.date}</span>
                            </div>
                            <p className="text-sm text-gray-600">{scan.treatment}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Cost: ฿{scan.cost}
                              </span>
                              <span className={`text-xs ${getResultColor(scan.result)}`}>
                                Result: {scan.result}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
