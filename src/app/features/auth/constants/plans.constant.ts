import { type IPlan } from '../types/auth.types';

export const AVAILABLE_PLANS: IPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    currency: 'USD',
    interval: null,
    features: ['Track up to 50 transactions', 'Basic reports', '1 account'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited transactions', 'Advanced analytics', '5 accounts', 'CSV import'],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: ['Everything in Standard', 'Unlimited accounts', 'Priority support', 'API access', 'Custom categories'],
  },
];
