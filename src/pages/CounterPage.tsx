import React from 'react';
import { CounterMode } from '@/components/CounterMode';

const CounterPage = () => {
  // For now, use a default shop ID - in a real app this would come from URL params or auth
  const shopId = 'default-shop-001';

  return <CounterMode shopId={shopId} />;
};

export default CounterPage;
