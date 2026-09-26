export const CATEGORIES = [
  { value: 'tools', label: 'Tools & DIY' },
  { value: 'books', label: 'Books & Academics' },
  { value: 'electronics', label: 'Electronics & Tech' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'camping', label: 'Camping & Outdoors' },
  { value: 'kitchen', label: 'Kitchen & Cooking' },
  { value: 'furniture', label: 'Furniture & Living' },
  { value: 'clothing', label: 'Clothing & Costumes' },
  { value: 'musical_instruments', label: 'Musical Instruments' },
  { value: 'other', label: 'Other Items' },
];

export const ITEM_CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available for Borrowing' },
  { value: 'unavailable', label: 'Temporarily Paused' },
];

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'creditCost', label: 'Credits: Low to High' },
  { value: '-creditCost', label: 'Credits: High to Low' },
  { value: 'title', label: 'Title: A to Z' },
];

export const BORROW_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

export const LOAN_EFFECTIVE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active (In Progress)' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CREDIT_TRANSACTION_TYPES = [
  { value: '', label: 'All Transactions' },
  { value: 'signup_bonus', label: 'Signup Bonus' },
  { value: 'borrow_spend', label: 'Borrowing Spend' },
  { value: 'lending_reward', label: 'Lending Reward' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
];
