export type UserRole = 'customer' | 'partner';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  walletBalance: number;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  sellerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  id?: string;
  uid: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface WishlistItem {
  id?: string;
  uid: string;
  productId: string;
  product: Product;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id?: string;
  uid: string;
  items: CartItem[];
  amount: number;
  status: 'placed' | 'failed';
  paymentStatus: 'success' | 'failed' | 'pending';
  sellerIds: string[];
  address: OrderAddress;
  createdAt: number;
}

export interface WalletTransaction {
  id?: string;
  uid: string;
  type: 'credit' | 'debit';
  amount: number;
  note: string;
  createdAt: number;
}
