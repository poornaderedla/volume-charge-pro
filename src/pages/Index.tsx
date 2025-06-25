
import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Download, Mail, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShipmentItem {
  id: string;
  length: number;
  width: number;
  height: number;
  grossWeight: number;
  carrier: string;
  customDivisor?: number;
}

interface CalculationResult {
  volumetricWeight: number;
  chargeableWeight: number;
  formula: string;
}

const carrierDivisors = {
  'IATA': 6000,
  'DHL': 5000,
  'FedEx': 5000,
  'UPS': 5000,
  'Custom': 0
};

const Index = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([
    {
      id: '1',
      length: 0,
      width: 0,
      height: 0,
      grossWeight: 0,
      carrier: 'DHL',
      customDivisor: 5000
    }
  ]);

  const calculateVolumetricWeight = (length: number, width: number, height: number, divisor: number, unit: string): number => {
    const volume = length * width * height;
    if (unit === 'imperial') {
      return volume / 166; // Standard imperial conversion
    }
    return volume / divisor;
  };

  const convertUnits = (value: number, from: string, to: string, type: 'dimension' | 'weight'): number => {
    if (from === to) return value;
    
    if (type === 'dimension') {
      if (from === 'metric' && to === 'imperial') return value / 2.54; // cm to inches
      if (from === 'imperial' && to === 'metric') return value * 2.54; // inches to cm
    } else {
      if (from === 'metric' && to === 'imperial') return value * 2.20462; // kg to lb
      if (from === 'imperial' && to === 'metric') return value / 2.20462; // lb to kg
    }
    return value;
  };

  const getCalculationResult = (item: ShipmentItem): CalculationResult => {
    const divisor = item.carrier === 'Custom' ? (item.customDivisor || 5000) : carrierDivisors[item.carrier as keyof typeof carrierDivisors];
    const volumetricWeight = calculateVolumetricWeight(item.length, item.width, item.height, divisor, unitSystem);
    const chargeableWeight = Math.max(volumetricWeight, item.grossWeight);
    
    const dimensionUnit = unitSystem === 'metric' ? 'cm' : 'in';
    const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';
    const formula = unitSystem === 'imperial' 
      ? `(${item.length} × ${item.width} × ${item.height}) ÷ 166 = ${volumetricWeight.toFixed(2)} ${weightUnit}`
      : `(${item.length} × ${item.width} × ${item.height}) ÷ ${divisor} = ${volumetricWeight.toFixed(2)} ${weightUnit}`;

    return {
      volumetricWeight,
      chargeableWeight,
      formula
    };
  };

  const addShipmentItem = () => {
    const newItem: ShipmentItem = {
      id: Date.now().toString(),
      length: 0,
      width: 0,
      height: 0,
      grossWeight: 0,
      carrier: 'DHL',
      customDivisor: 5000
    };
    setShipmentItems([...shipmentItems, newItem]);
  };

  const removeShipmentItem = (id: string) => {
    setShipmentItems(shipmentItems.filter(item => item.id !== id));
  };

  const updateShipmentItem = (id: string, field: keyof ShipmentItem, value: any) => {
    setShipmentItems(shipmentItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotals = () => {
    const totals = shipmentItems.reduce((acc, item) => {
      const result = getCalculationResult(item);
      return {
        totalVolumetric: acc.totalVolumetric + result.volumetricWeight,
        totalGross: acc.totalGross + item.grossWeight,
        totalChargeable: acc.totalChargeable + result.chargeableWeight
      };
    }, { totalVolumetric: 0, totalGross: 0, totalChargeable: 0 });

    return totals;
  };

  const resetForm = () => {
    setShipmentItems([{
      id: '1',
      length: 0,
      width: 0,
      height: 0,
      grossWeight: 0,
      carrier: 'DHL',
      customDivisor: 5000
    }]);
  };

  const totals = calculateTotals();
  const dimensionUnit = unitSystem === 'metric' ? 'cm' : 'in';
  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <TooltipProvider>
        {/* Header */}
        <div className="bg-[#245e4f] text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Volumetric & Chargeable Weight Calculator</h1>
            <p className="text-xl text-[#7ac9a7]">Determine Freight Cost Based on Dimensional and Gross Weight</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Input Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Unit Toggle Card */}
              <Card className="border-2 border-[#7ac9a7]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-[#245e4f]">
                    <span>Unit System</span>
                    <Tabs value={unitSystem} onValueChange={(value) => setUnitSystem(value as 'metric' | 'imperial')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="metric">Metric (cm/kg)</TabsTrigger>
                        <TabsTrigger value="imperial">Imperial (in/lb)</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Shipment Items */}
              {shipmentItems.map((item, index) => (
                <Card key={item.id} className="border-2 border-gray-200 hover:border-[#7ac9a7] transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-[#245e4f]">
                      <span>Shipment Item #{index + 1}</span>
                      {shipmentItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeShipmentItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`length-${item.id}`}>Length ({dimensionUnit})</Label>
                        <Input
                          id={`length-${item.id}`}
                          type="number"
                          step="0.1"
                          value={item.length || ''}
                          onChange={(e) => updateShipmentItem(item.id, 'length', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`width-${item.id}`}>Width ({dimensionUnit})</Label>
                        <Input
                          id={`width-${item.id}`}
                          type="number"
                          step="0.1"
                          value={item.width || ''}
                          onChange={(e) => updateShipmentItem(item.id, 'width', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`height-${item.id}`}>Height ({dimensionUnit})</Label>
                        <Input
                          id={`height-${item.id}`}
                          type="number"
                          step="0.1"
                          value={item.height || ''}
                          onChange={(e) => updateShipmentItem(item.id, 'height', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Weight and Carrier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`weight-${item.id}`}>Gross Weight ({weightUnit})</Label>
                        <Input
                          id={`weight-${item.id}`}
                          type="number"
                          step="0.1"
                          value={item.grossWeight || ''}
                          onChange={(e) => updateShipmentItem(item.id, 'grossWeight', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Carrier Standard
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Different carriers use different divisors:<br/>
                              IATA: 6000 | DHL/FedEx/UPS: 5000</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Select
                          value={item.carrier}
                          onValueChange={(value) => updateShipmentItem(item.id, 'carrier', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IATA">IATA (6000)</SelectItem>
                            <SelectItem value="DHL">DHL (5000)</SelectItem>
                            <SelectItem value="FedEx">FedEx (5000)</SelectItem>
                            <SelectItem value="UPS">UPS (5000)</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {item.carrier === 'Custom' && (
                          <Input
                            type="number"
                            placeholder="Enter custom divisor"
                            value={item.customDivisor || ''}
                            onChange={(e) => updateShipmentItem(item.id, 'customDivisor', parseFloat(e.target.value) || 5000)}
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>

                    {/* Individual Item Result */}
                    {(item.length > 0 && item.width > 0 && item.height > 0 && item.grossWeight > 0) && (
                      <div className="mt-4 p-4 bg-[#7ac9a7]/10 rounded-lg border border-[#7ac9a7]/30">
                        <h4 className="font-semibold text-[#245e4f] mb-2">Item Calculation Result</h4>
                        {(() => {
                          const result = getCalculationResult(item);
                          return (
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Formula:</span> {result.formula}</p>
                              <p><span className="font-medium">Volumetric Weight:</span> {result.volumetricWeight.toFixed(2)} {weightUnit}</p>
                              <p><span className="font-medium">Gross Weight:</span> {item.grossWeight.toFixed(2)} {weightUnit}</p>
                              <p className="text-lg font-bold text-[#245e4f]">
                                <span className="font-medium">Chargeable Weight:</span> {result.chargeableWeight.toFixed(2)} {weightUnit}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button onClick={addShipmentItem} className="bg-[#7ac9a7] hover:bg-[#245e4f] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Item
                </Button>
                <Button variant="outline" onClick={resetForm} className="border-[#245e4f] text-[#245e4f] hover:bg-[#245e4f] hover:text-white">
                  Reset Form
                </Button>
              </div>
            </div>

            {/* Right Column - Results Summary */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="border-2 border-[#e9c46a] bg-gradient-to-br from-white to-[#e9c46a]/5">
                <CardHeader>
                  <CardTitle className="text-[#245e4f] flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Shipment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium text-gray-600">Total Items:</span>
                      <span className="font-bold">{shipmentItems.length}</span>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium text-gray-600">Total Volumetric:</span>
                        <span className="font-bold">{totals.totalVolumetric.toFixed(2)} {weightUnit}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium text-gray-600">Total Gross:</span>
                        <span className="font-bold">{totals.totalGross.toFixed(2)} {weightUnit}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium text-[#245e4f]">Total Chargeable:</span>
                        <Badge className="bg-[#e9c46a] text-[#245e4f] hover:bg-[#e9c46a]/80 text-lg px-3 py-1">
                          {totals.totalChargeable.toFixed(2)} {weightUnit}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#245e4f]">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-[#245e4f] hover:bg-[#245e4f]/90 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="w-full border-[#245e4f] text-[#245e4f] hover:bg-[#245e4f] hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" className="w-full border-[#245e4f] text-[#245e4f] hover:bg-[#245e4f] hover:text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Quote
                  </Button>
                </CardContent>
              </Card>

              {/* AI Integration Placeholder */}
              <Card className="border-2 border-dashed border-[#7ac9a7]">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-2xl">🚀</div>
                    <h3 className="font-semibold text-[#245e4f]">Coming Soon</h3>
                    <p className="text-sm text-gray-600">
                      AI Assistant to optimize packaging size vs. cost using volumetric AI modeling.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Index;
