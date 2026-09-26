/**
 * Development seed script — populates the database with realistic
 * demo data across two communities: an admin, several users, items,
 * borrow requests in every status, loans (active and returned),
 * credit transactions, reviews, and notifications.
 *
 * Bypasses the HTTP API entirely (this runs directly against the
 * models), but reuses the real User model so passwords go through the
 * exact same bcrypt hashing the API itself uses — there is no separate
 * "seed-only" password path.
 *
 * IDEMPOTENT: checks for the demo admin account first; if it already
 * exists, the whole script exits without creating anything, so running
 * `npm run seed` twice never produces duplicate data.
 *
 * FOR LOCAL DEVELOPMENT ONLY. Never run this against a production
 * database — see the plaintext demo passwords below.
 *
 * Usage:
 *   npm run seed
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const BorrowRequest = require('../src/models/BorrowRequest');
const Loan = require('../src/models/Loan');
const CreditTransaction = require('../src/models/CreditTransaction');
const Review = require('../src/models/Review');
const Notification = require('../src/models/Notification');

const COMMUNITY_A = 'IEM-KOLKATA';
const COMMUNITY_B = 'STANFORD-DORM';
const DEMO_PASSWORD = 'Password123'; // plaintext here only for the console printout below; hashed as usual by User's pre-save hook

const daysFromNow = (n) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** Records a signup bonus transaction identical in shape to the one authController creates. */
const grantSignupBonus = async (user) => {
  await CreditTransaction.create({
    user: user._id,
    amount: user.creditsBalance,
    type: 'signup_bonus',
    balanceBefore: 0,
    balanceAfter: user.creditsBalance,
    description: 'Welcome bonus for joining BorrowBox.',
  });
};

/**
 * Moves credits from borrower to owner and records both
 * CreditTransaction rows, mirroring borrowRequestController's
 * approval math (creditCost × days) exactly — done here as plain
 * sequential writes (no transaction) since this is a one-time local
 * setup script, not a concurrent production code path.
 */
const settleCredits = async ({ borrower, owner, item, loan, days }) => {
  const cost = item.creditCost * days;

  const borrowerBefore = borrower.creditsBalance;
  const ownerBefore = owner.creditsBalance;
  borrower.creditsBalance -= cost;
  owner.creditsBalance += cost;
  await borrower.save();
  await owner.save();

  await CreditTransaction.create([
    {
      user: borrower._id,
      amount: -cost,
      type: 'borrow_spend',
      balanceBefore: borrowerBefore,
      balanceAfter: borrower.creditsBalance,
      loan: loan._id,
      description: `Borrowed "${item.title}" for ${days} day(s).`,
    },
    {
      user: owner._id,
      amount: cost,
      type: 'lending_reward',
      balanceBefore: ownerBefore,
      balanceAfter: owner.creditsBalance,
      loan: loan._id,
      description: `Lent out "${item.title}" for ${days} day(s).`,
    },
  ]);

  return cost;
};

const seed = async () => {
  await connectDB();

  const alreadySeeded = await User.exists({ email: 'admin@borrowbox.dev' });
  if (alreadySeeded) {
    console.log('Seed data already present (admin@borrowbox.dev exists) — skipping. Nothing was changed.');
    await mongoose.connection.close();
    return;
  }

  console.log('Seeding demo data...');

  // --- Users ---
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_A,
    role: 'admin',
  });
  const alice = await User.create({
    name: 'Alice Sharma',
    email: 'alice@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_A,
  });
  const bob = await User.create({
    name: 'Bob Das',
    email: 'bob@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_A,
  });
  const carol = await User.create({
    name: 'Carol Roy',
    email: 'carol@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_A,
  });
  const dave = await User.create({
    name: 'Dave Chen',
    email: 'dave@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_B,
  });
  const erin = await User.create({
    name: 'Erin Patel',
    email: 'erin@borrowbox.dev',
    password: DEMO_PASSWORD,
    communityId: COMMUNITY_B,
  });

  for (const user of [admin, alice, bob, carol, dave, erin]) {
    // eslint-disable-next-line no-await-in-loop
    await grantSignupBonus(user);
  }
  console.log(`Created 6 users (1 admin) across 2 communities: ${COMMUNITY_A}, ${COMMUNITY_B}`);

  // --- Items ---
  const drill = await Item.create({
    title: 'Cordless Drill',
    description: '18V cordless drill, barely used, comes with two batteries.',
    category: 'tools',
    condition: 'good',
    owner: alice._id,
    communityId: COMMUNITY_A,
    creditCost: 2,
    purchasePrice: 3000,
    rentalPricePerDay: 100,
  });
  const tent = await Item.create({
    title: 'Camping Tent (4-person)',
    description: 'Waterproof 4-person tent, used twice, easy setup.',
    category: 'camping',
    condition: 'like_new',
    owner: alice._id,
    communityId: COMMUNITY_A,
    creditCost: 3,
    purchasePrice: 5000,
    rentalPricePerDay: 150,
  });
  const textbook = await Item.create({
    title: 'Introduction to Algorithms (CLRS)',
    description: '3rd edition, some highlighting, all pages intact.',
    category: 'books',
    condition: 'fair',
    owner: carol._id,
    communityId: COMMUNITY_A,
    creditCost: 1,
    purchasePrice: 800,
  });
  const camera = await Item.create({
    title: 'DSLR Camera',
    description: 'Entry-level DSLR with an 18-55mm kit lens.',
    category: 'electronics',
    condition: 'good',
    owner: dave._id,
    communityId: COMMUNITY_B,
    creditCost: 2,
    purchasePrice: 40000,
    rentalPricePerDay: 500,
  });
  const racket = await Item.create({
    title: 'Badminton Racket Set (2 rackets + shuttlecocks)',
    description: 'Currently keeping this at home for a tournament — temporarily paused.',
    category: 'sports',
    condition: 'good',
    owner: dave._id,
    communityId: COMMUNITY_B,
    creditCost: 1,
    purchasePrice: 1200,
    rentalPricePerDay: 50,
    availabilityStatus: 'unavailable',
  });
  console.log('Created 5 items across both communities.');

  // --- Borrow requests + loans (community A) ---

  // 1. Bob borrows Alice's drill, already returned -> enables reviews.
  const req1 = await BorrowRequest.create({
    item: drill._id,
    borrower: bob._id,
    owner: alice._id,
    communityId: COMMUNITY_A,
    startDate: daysFromNow(-10),
    endDate: daysFromNow(-8),
    status: 'approved',
    message: 'Need it for a shelf-mounting project.',
  });
  const loan1 = await Loan.create({
    item: drill._id,
    borrower: bob._id,
    owner: alice._id,
    communityId: COMMUNITY_A,
    borrowRequest: req1._id,
    startDate: req1.startDate,
    endDate: req1.endDate,
    status: 'returned',
    actualReturnDate: daysFromNow(-8),
  });
  const cost1 = await settleCredits({ borrower: bob, owner: alice, item: drill, loan: loan1, days: 2 });

  // 2. Bob requests Alice's tent — still pending.
  const req2 = await BorrowRequest.create({
    item: tent._id,
    borrower: bob._id,
    owner: alice._id,
    communityId: COMMUNITY_A,
    startDate: daysFromNow(7),
    endDate: daysFromNow(10),
    status: 'pending',
    message: 'Weekend camping trip.',
  });

  // 3. Carol requests Alice's drill for different dates — rejected.
  const req3 = await BorrowRequest.create({
    item: drill._id,
    borrower: carol._id,
    owner: alice._id,
    communityId: COMMUNITY_A,
    startDate: daysFromNow(3),
    endDate: daysFromNow(4),
    status: 'rejected',
    rejectionReason: 'Already lent out to someone else that week.',
  });

  // 4. Bob requests Carol's textbook — cancelled by Bob.
  const req4 = await BorrowRequest.create({
    item: textbook._id,
    borrower: bob._id,
    owner: carol._id,
    communityId: COMMUNITY_A,
    startDate: daysFromNow(14),
    endDate: daysFromNow(16),
    status: 'cancelled',
    message: 'Studying for finals.',
  });

  console.log('Created 4 borrow requests in community A (returned loan, pending, rejected, cancelled).');

  // --- Borrow request + loan (community B) — currently active ---
  const req5 = await BorrowRequest.create({
    item: camera._id,
    borrower: erin._id,
    owner: dave._id,
    communityId: COMMUNITY_B,
    startDate: daysFromNow(-1),
    endDate: daysFromNow(1),
    status: 'approved',
    message: 'Shooting a short film for a class project.',
  });
  const loan2 = await Loan.create({
    item: camera._id,
    borrower: erin._id,
    owner: dave._id,
    communityId: COMMUNITY_B,
    borrowRequest: req5._id,
    startDate: req5.startDate,
    endDate: req5.endDate,
    status: 'active',
  });
  const cost2 = await settleCredits({ borrower: erin, owner: dave, item: camera, loan: loan2, days: 2 });

  console.log('Created 1 active loan in community B.');

  // --- Reviews (only the returned loan qualifies) ---
  const review1 = await Review.create({
    reviewer: bob._id,
    reviewee: alice._id,
    loan: loan1._id,
    item: drill._id,
    rating: 5,
    comment: 'Drill worked perfectly, Alice was quick to respond. Great experience!',
  });
  const review2 = await Review.create({
    reviewer: alice._id,
    reviewee: bob._id,
    loan: loan1._id,
    item: drill._id,
    rating: 4,
    comment: 'Returned on time and in good condition.',
  });
  console.log('Created 2 reviews for the returned loan.');

  // --- Notifications (a representative sample, not exhaustive) ---
  await Notification.create([
    {
      recipient: alice._id,
      type: 'borrow_request_received',
      title: 'New borrow request',
      message: `${bob.name} requested to borrow "${drill.title}".`,
      relatedEntityType: 'BorrowRequest',
      relatedEntityId: req1._id,
      isRead: true,
    },
    {
      recipient: bob._id,
      type: 'borrow_request_approved',
      title: 'Borrow request approved',
      message: 'Your borrow request was approved.',
      relatedEntityType: 'Loan',
      relatedEntityId: loan1._id,
      isRead: true,
    },
    {
      recipient: bob._id,
      type: 'credit_spent',
      title: 'Credits spent',
      message: `${cost1} credit(s) were deducted for this borrowing.`,
      relatedEntityType: 'Loan',
      relatedEntityId: loan1._id,
      isRead: true,
    },
    {
      recipient: alice._id,
      type: 'credit_received',
      title: 'Credits earned',
      message: `You earned ${cost1} credit(s) for lending your item.`,
      relatedEntityType: 'Loan',
      relatedEntityId: loan1._id,
      isRead: true,
    },
    {
      recipient: alice._id,
      type: 'item_returned',
      title: 'Item returned',
      message: 'Your item has been marked as returned.',
      relatedEntityType: 'Loan',
      relatedEntityId: loan1._id,
      isRead: true,
    },
    {
      recipient: alice._id,
      type: 'review_received',
      title: 'You received a new review',
      message: 'You received a 5-star review.',
      relatedEntityType: 'Review',
      relatedEntityId: review1._id,
      isRead: false,
    },
    {
      recipient: bob._id,
      type: 'review_received',
      title: 'You received a new review',
      message: 'You received a 4-star review.',
      relatedEntityType: 'Review',
      relatedEntityId: review2._id,
      isRead: false,
    },
    {
      recipient: carol._id,
      type: 'borrow_request_rejected',
      title: 'Borrow request rejected',
      message: `Your borrow request was rejected: ${req3.rejectionReason}`,
      relatedEntityType: 'BorrowRequest',
      relatedEntityId: req3._id,
      isRead: false,
    },
    {
      recipient: carol._id,
      type: 'borrow_request_cancelled',
      title: 'Borrow request cancelled',
      message: `${bob.name} cancelled their borrow request.`,
      relatedEntityType: 'BorrowRequest',
      relatedEntityId: req4._id,
      isRead: false,
    },
    {
      recipient: dave._id,
      type: 'credit_received',
      title: 'Credits earned',
      message: `You earned ${cost2} credit(s) for lending your item.`,
      relatedEntityType: 'Loan',
      relatedEntityId: loan2._id,
      isRead: false,
    },
  ]);
  console.log('Created 10 notifications.');

  console.log('\nSeed complete. Demo accounts (FOR LOCAL DEVELOPMENT ONLY):');
  console.log('  admin@borrowbox.dev / Password123  (role: admin, community: ' + COMMUNITY_A + ')');
  console.log('  alice@borrowbox.dev / Password123  (community: ' + COMMUNITY_A + ')');
  console.log('  bob@borrowbox.dev   / Password123  (community: ' + COMMUNITY_A + ')');
  console.log('  carol@borrowbox.dev / Password123  (community: ' + COMMUNITY_A + ')');
  console.log('  dave@borrowbox.dev  / Password123  (community: ' + COMMUNITY_B + ')');
  console.log('  erin@borrowbox.dev  / Password123  (community: ' + COMMUNITY_B + ')');

  await mongoose.connection.close();
};

seed().catch(async (err) => {
  console.error('Seed script failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
