const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [80, 'Name must be at most 80 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      // MVP decision: every self-registered account is a plain "user".
      // Admin accounts are promoted manually (e.g. directly in the DB or
      // via a future admin-only endpoint) rather than through public
      // registration, so this module deliberately does not expose a way
      // to register as admin.
    },
    // MVP decision: BorrowBox is designed around closed communities
    // (e.g. one college campus). Rather than building a full Community
    // model in this module, communityId is stored as a simple string
    // identifier/code (e.g. "IEM-KOLKATA") that later modules (item
    // listings, discovery) will filter on. It can be normalized into
    // its own collection with a proper reference in a later module
    // without breaking this field's meaning.
    communityId: {
      type: String,
      required: [true, 'communityId is required'],
      trim: true,
      index: true,
    },
    creditsBalance: {
      type: Number,
      default: 5,
      // MVP decision: new members start with a small welcome balance of
      // Borrow Credits (5) so they can immediately request an item
      // before they have lent anything themselves. This can be tuned
      // later without a schema change.
      min: [0, 'creditsBalance cannot be negative'],
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method to compare a plaintext password against the stored hash.
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure password (and __v) never leak through JSON responses even if
// a controller accidentally serializes a full document.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
