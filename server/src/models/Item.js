const mongoose = require('mongoose');

// --- Enum choices, explained ---
//
// CONDITION: describes the physical state of the item being listed.
// Chosen as a small, unambiguous scale a lender can self-assess in
// seconds — finer grades (e.g. "9/10") would need a rubric nobody
// would consistently follow in an MVP.
const ITEM_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];

// AVAILABILITY STATUS: the item's current lending state.
// - available:    can be requested right now
// - requested:    a borrow request is pending owner approval (module 3)
// - borrowed:     currently out with a borrower (module 3)
// - unavailable:  owner has manually paused it (e.g. temporarily needs it)
// This module only ever sets/reads "available" and "unavailable" — the
// other two values exist now so the schema doesn't need a breaking
// change when the borrowing-request module is added.
const AVAILABILITY_STATUSES = ['available', 'requested', 'borrowed', 'unavailable'];

const CATEGORIES = [
  'tools',
  'books',
  'electronics',
  'sports',
  'camping',
  'kitchen',
  'furniture',
  'clothing',
  'musical_instruments',
  'other',
];

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [100, 'Title must be at most 100 characters long'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description must be at most 2000 characters long'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `category must be one of: ${CATEGORIES.join(', ')}`,
      },
      index: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ITEM_CONDITIONS,
        message: `condition must be one of: ${ITEM_CONDITIONS.join(', ')}`,
      },
    },
    // MVP decision: no file-upload/image-storage service exists yet, so
    // images are stored as an array of URL strings (e.g. links the
    // owner pastes, or URLs from a future upload step). Capped at 5 to
    // keep documents small; a dedicated media module can replace this
    // later without changing the field's shape (still an array of
    // strings) if it stores URLs from cloud storage.
    images: {
      type: [
        {
          type: String,
          trim: true,
          match: [/^https?:\/\/.+/i, 'Each image must be a valid http(s) URL'],
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'A maximum of 5 images is allowed per item.',
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Copied from the owner's communityId at creation time (rather than
    // populated from `owner` on every read) so discovery queries can
    // filter with a single indexed field and don't break if the owner
    // is ever removed from the community later.
    communityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    creditCost: {
      type: Number,
      required: [true, 'creditCost is required'],
      min: [0, 'creditCost cannot be negative'],
    },
    purchasePrice: {
      type: Number,
      min: [0, 'purchasePrice cannot be negative'],
      default: null,
    },
    rentalPricePerDay: {
      type: Number,
      min: [0, 'rentalPricePerDay cannot be negative'],
      default: null,
    },
    availabilityStatus: {
      type: String,
      enum: {
        values: AVAILABILITY_STATUSES,
        message: `availabilityStatus must be one of: ${AVAILABILITY_STATUSES.join(', ')}`,
      },
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: the discovery feed always filters by community and
// usually by category/availability together, and often sorts by
// createdAt — this index serves that access pattern directly.
itemSchema.index({ communityId: 1, availabilityStatus: 1, createdAt: -1 });

// Text index powers the `search` query param (title + description).
itemSchema.index({ title: 'text', description: 'text' });

itemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Item', itemSchema);
module.exports.ITEM_CONDITIONS = ITEM_CONDITIONS;
module.exports.AVAILABILITY_STATUSES = AVAILABILITY_STATUSES;
module.exports.CATEGORIES = CATEGORIES;
