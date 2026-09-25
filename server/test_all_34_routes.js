const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return { status: res.status, headers: res.headers, data };
}

let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(testId, name, condition, details = '') {
  if (condition) {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${testId}: ${name}`);
    results.push({ testId, name, status: 'PASS', details });
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testId}: ${name} -> ${details}`);
    results.push({ testId, name, status: 'FAIL', details });
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('BORROWBOX 34-ROUTE COMPLETE AUTOMATED TEST SUITE');
  console.log('='.repeat(70));

  await mongoose.connect('mongodb://127.0.0.1:27017/borrowbox?replicaSet=rs0');
  const db = mongoose.connection.db;

  // Clean test collections
  await db.collection('users').deleteMany({ email: /@(example\.com)/ });
  await db.collection('items').deleteMany({});
  await db.collection('borrowrequests').deleteMany({});
  await db.collection('loans').deleteMany({});
  await db.collection('credittransactions').deleteMany({});
  await db.collection('reviews').deleteMany({});
  await db.collection('notifications').deleteMany({});

  console.log('\n--- 00. SETUP PREREQUISITES ---');
  // Register User A
  let res = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'User A', email: 'usera@example.com', password: 'SuperSecret123', communityId: 'IEM-KOLKATA' },
  });
  const tokenA = res.data?.data?.token;
  const userAId = res.data?.data?.user?.id;
  assert('Setup 1', 'Register User A', res.status === 201 && !!tokenA, `Status ${res.status}`);

  // Register User B
  res = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'User B', email: 'userb@example.com', password: 'SuperSecret123', communityId: 'IEM-KOLKATA' },
  });
  const tokenB = res.data?.data?.token;
  const userBId = res.data?.data?.user?.id;
  assert('Setup 2', 'Register User B', res.status === 201 && !!tokenB, `Status ${res.status}`);

  // Register User C
  res = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'User C', email: 'userc@example.com', password: 'SuperSecret123', communityId: 'HERITAGE-KOLKATA' },
  });
  const tokenC = res.data?.data?.token;
  const userCId = res.data?.data?.user?.id;
  assert('Setup 3', 'Register User C (Other Community)', res.status === 201 && !!tokenC, `Status ${res.status}`);

  // Credit boost User B to 10 credits so User B can afford 6-credit loan in Part 2
  await db.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(userBId) },
    { $set: { creditsBalance: 10 } }
  );

  // User A creates Item 1 (creditCost: 2)
  res = await req('/api/items', {
    method: 'POST',
    token: tokenA,
    body: {
      title: 'Cordless Drill',
      description: 'Power drill available for community borrowing.',
      category: 'tools',
      condition: 'good',
      images: [],
      creditCost: 2,
    },
  });
  const item1Id = res.data?.data?.item?.id;
  assert('Setup 4', 'User A creates Item 1 (creditCost: 2)', res.status === 201 && !!item1Id, `Status ${res.status}`);

  // User B creates borrow request (3 days: Oct 1 - Oct 4 = 3 days * 2 = 6 credits)
  res = await req('/api/borrow-requests', {
    method: 'POST',
    token: tokenB,
    body: {
      itemId: item1Id,
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      message: 'Need for repairs.',
    },
  });
  const requestId = res.data?.data?.borrowRequest?.id;
  assert('Setup 5', 'User B creates borrow request (requestId)', res.status === 201 && !!requestId, `Status ${res.status}`);

  console.log('\n--- PART 1: CREDITS (Tests 1–3) ---');
  // Test 1 — Register User E
  res = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'User E', email: 'usere@example.com', password: 'SuperSecret123', communityId: 'IEM-KOLKATA' },
  });
  const tokenE = res.data?.data?.token;
  const userEId = res.data?.data?.user?.id;
  const eCredits = res.data?.data?.user?.creditsBalance;
  assert('Test 1', 'Register User E (201, 5 credits starting balance)', res.status === 201 && eCredits === 5, `Status: ${res.status}, credits: ${eCredits}`);

  // Test 2 — Get User E credit balance
  res = await req('/api/credits/balance', { token: tokenE });
  assert('Test 2', 'Get User E credit balance (200, creditsBalance: 5)', res.status === 200 && res.data?.data?.creditsBalance === 5, `Balance: ${res.data?.data?.creditsBalance}`);

  // Test 3 — Get User E credit transactions
  res = await req('/api/credits/transactions', { token: tokenE });
  const txE = res.data?.data?.transactions || [];
  const bonusTx = txE.find(t => t.type === 'signup_bonus');
  assert('Test 3', 'Get User E credit transactions (has signup_bonus 5)', res.status === 200 && !!bonusTx && bonusTx.amount === 5, `Found: ${JSON.stringify(bonusTx)}`);

  console.log('\n--- PART 2: CREDIT DEDUCTION + LENDER REWARD (Tests 4–10) ---');
  // Test 4 — Check User B balance
  res = await req('/api/credits/balance', { token: tokenB });
  const B_before = res.data?.data?.creditsBalance;
  assert('Test 4', 'Check User B balance before approval', res.status === 200 && typeof B_before === 'number', `B_before: ${B_before}`);

  // Test 5 — Check User A balance
  res = await req('/api/credits/balance', { token: tokenA });
  const A_before = res.data?.data?.creditsBalance;
  assert('Test 5', 'Check User A balance before approval', res.status === 200 && typeof A_before === 'number', `A_before: ${A_before}`);

  // Test 6 — Approve borrow request
  res = await req(`/api/borrow-requests/${requestId}/approve`, {
    method: 'PATCH',
    token: tokenA,
  });
  const loanId = res.data?.data?.loan?.id;
  const charged = res.data?.data?.creditsCharged;
  assert('Test 6', 'Approve borrow request (200, creditsCharged: 6, loan created)', res.status === 200 && charged === 6 && !!loanId, `Status: ${res.status}, charged: ${charged}, loanId: ${loanId}`);

  // Test 7 — Verify User B lost credits
  res = await req('/api/credits/balance', { token: tokenB });
  const B_after = res.data?.data?.creditsBalance;
  assert('Test 7', `Verify User B lost 6 credits (expected: ${B_before - 6}, got: ${B_after})`, res.status === 200 && B_after === B_before - 6, `B_after: ${B_after}`);

  // Test 8 — Verify User A received credits
  res = await req('/api/credits/balance', { token: tokenA });
  const A_after = res.data?.data?.creditsBalance;
  assert('Test 8', `Verify User A gained 6 credits (expected: ${A_before + 6}, got: ${A_after})`, res.status === 200 && A_after === A_before + 6, `A_after: ${A_after}`);

  // Test 9 — Verify borrower's transaction
  res = await req('/api/credits/transactions', { token: tokenB });
  const bTx = res.data?.data?.transactions || [];
  const spendTx = bTx.find(t => t.type === 'borrow_spend' && t.loan === loanId);
  assert('Test 9', 'Verify borrower borrow_spend transaction (-6 credits)', res.status === 200 && !!spendTx && spendTx.amount === -6, `Spend tx: ${JSON.stringify(spendTx)}`);

  // Test 10 — Verify owner's transaction
  res = await req('/api/credits/transactions', { token: tokenA });
  const aTx = res.data?.data?.transactions || [];
  const rewardTx = aTx.find(t => t.type === 'lending_reward' && t.loan === loanId);
  assert('Test 10', 'Verify owner lending_reward transaction (+6 credits)', res.status === 200 && !!rewardTx && rewardTx.amount === 6, `Reward tx: ${JSON.stringify(rewardTx)}`);

  console.log('\n--- PART 3: INSUFFICIENT CREDITS & ROLLBACK (Tests 11–14) ---');
  // Test 11 — Register User F
  res = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'User F', email: 'userf@example.com', password: 'SuperSecret123', communityId: 'IEM-KOLKATA' },
  });
  const tokenF = res.data?.data?.token;
  const userFId = res.data?.data?.user?.id;
  const fCredits = res.data?.data?.user?.creditsBalance;
  assert('Test 11', 'Register User F (201, 5 credits starting balance)', res.status === 201 && fCredits === 5, `Status: ${res.status}`);

  // Test 12 — Create expensive item
  res = await req('/api/items', {
    method: 'POST',
    token: tokenA,
    body: {
      title: 'Expensive Camera',
      description: 'Professional camera available for community borrowing.',
      category: 'electronics',
      condition: 'good',
      images: [],
      creditCost: 3,
    },
  });
  const expensiveItemId = res.data?.data?.item?.id;
  assert('Test 12', 'Create expensive item (creditCost: 3)', res.status === 201 && !!expensiveItemId, `ItemId: ${expensiveItemId}`);

  // Test 13 — User F creates borrow request (3 days * 3 = 9 credits)
  res = await req('/api/borrow-requests', {
    method: 'POST',
    token: tokenF,
    body: {
      itemId: expensiveItemId,
      startDate: '2026-10-10',
      endDate: '2026-10-13',
      message: 'Need it for a project.',
    },
  });
  const expensiveRequestId = res.data?.data?.borrowRequest?.id;
  assert('Test 13', 'User F creates borrow request (9 credits total)', res.status === 201 && !!expensiveRequestId, `RequestId: ${expensiveRequestId}`);

  // Test 14 — Approve expensive request (Expect 409 Conflict)
  res = await req(`/api/borrow-requests/${expensiveRequestId}/approve`, {
    method: 'PATCH',
    token: tokenA,
  });
  const msg14 = res.data?.message || '';
  assert('Test 14', 'Approve expensive request fails with 409 Conflict', res.status === 409 && msg14.includes('Insufficient credits'), `Status: ${res.status}, msg: ${msg14}`);

  // 14A. Request status still pending
  res = await req(`/api/borrow-requests/${expensiveRequestId}`, { token: tokenF });
  assert('Test 14A', 'Rollback verification: Request status is still pending', res.status === 200 && res.data?.data?.borrowRequest?.status === 'pending', `Status: ${res.data?.data?.borrowRequest?.status}`);

  // 14B. User F balance still 5
  res = await req('/api/credits/balance', { token: tokenF });
  assert('Test 14B', 'Rollback verification: User F balance remains 5', res.status === 200 && res.data?.data?.creditsBalance === 5, `Balance: ${res.data?.data?.creditsBalance}`);

  // 14C. User A balance unchanged
  res = await req('/api/credits/balance', { token: tokenA });
  assert('Test 14C', 'Rollback verification: User A balance unchanged', res.status === 200 && res.data?.data?.creditsBalance === A_after, `Balance: ${res.data?.data?.creditsBalance}`);

  // 14D. User A loans (no loan created for expensive request)
  res = await req('/api/loans/lending', { token: tokenA });
  const aLoans = res.data?.data?.loans || [];
  const foundExpLoan = aLoans.find(l => l.borrowRequest === expensiveRequestId);
  assert('Test 14D', 'Rollback verification: No loan created for expensive request', res.status === 200 && !foundExpLoan, `Found loan: ${!!foundExpLoan}`);

  console.log('\n--- PART 4: REVIEWS & REPUTATION (Tests 15–22) ---');
  // Test 15 — Try reviewing active loan (Expect 409)
  res = await req('/api/reviews', {
    method: 'POST',
    token: tokenB,
    body: { loanId, rating: 5, comment: 'Great, reliable lender.' },
  });
  assert('Test 15', 'Review active loan rejected with 409 Conflict', res.status === 409, `Status: ${res.status}, msg: ${res.data?.message}`);

  // Test 16 — Return loan
  res = await req(`/api/loans/${loanId}/return`, {
    method: 'PATCH',
    token: tokenB,
  });
  assert('Test 16', 'Return loan (200, status: returned, effectiveStatus: returned)', res.status === 200 && res.data?.data?.loan?.status === 'returned', `Status: ${res.status}, loan status: ${res.data?.data?.loan?.status}`);

  // Test 17 — User B reviews User A
  res = await req('/api/reviews', {
    method: 'POST',
    token: tokenB,
    body: { loanId, rating: 5, comment: 'Great, reliable lender.' },
  });
  assert('Test 17', 'User B reviews User A (201 Created, rating: 5)', res.status === 201 && res.data?.data?.review?.rating === 5, `Status: ${res.status}`);

  // Test 18 — User A reviews User B
  res = await req('/api/reviews', {
    method: 'POST',
    token: tokenA,
    body: { loanId, rating: 4, comment: 'Good borrower.' },
  });
  assert('Test 18', 'User A reviews User B (201 Created, rating: 4)', res.status === 201 && res.data?.data?.review?.rating === 4, `Status: ${res.status}`);

  // Test 19 — Duplicate review attempt by User B
  res = await req('/api/reviews', {
    method: 'POST',
    token: tokenB,
    body: { loanId, rating: 5, comment: 'Another review.' },
  });
  assert('Test 19', 'Duplicate review attempt rejected with 409 Conflict', res.status === 409, `Status: ${res.status}`);

  // Test 20 — Get User A reputation
  res = await req(`/api/reviews/user/${userAId}`, { token: tokenB });
  const rep = res.data?.data?.reputation;
  assert('Test 20', 'Get User A reputation (avgRating: 5, totalReviews: 1, completedLendings: 1)', res.status === 200 && rep?.averageRating === 5 && rep?.totalReviews === 1 && rep?.completedLendings === 1, `Reputation: ${JSON.stringify(rep)}`);

  // Test 21 — Get my reviews (User B)
  res = await req('/api/reviews/my', { token: tokenB });
  const myRev = res.data?.data?.reviews || [];
  assert('Test 21', 'Get my reviews for User B (contains review written about User A)', res.status === 200 && myRev.length >= 1 && myRev[0].rating === 5, `Count: ${myRev.length}`);

  // Test 22 — Get reviews for loan (User A)
  res = await req(`/api/reviews/loan/${loanId}`, { token: tokenA });
  const loanRev = res.data?.data?.reviews || [];
  assert('Test 22', 'Get reviews for loan (200 OK, 2 reviews)', res.status === 200 && loanRev.length === 2, `Count: ${loanRev.length}`);

  // Test 22 Security check — Unrelated User C
  res = await req(`/api/reviews/loan/${loanId}`, { token: tokenC });
  assert('Test 22 Security', 'User C gets 404 for unrelated community loan reviews', res.status === 404, `Status: ${res.status}`);

  console.log('\n--- PART 5: NOTIFICATIONS (Tests 23–28) ---');
  // Test 23 — Get notifications for User A
  res = await req('/api/notifications', { token: tokenA });
  const notifsA = res.data?.data?.notifications || [];
  assert('Test 23', 'Get User A notifications (200 OK, non-empty)', res.status === 200 && notifsA.length > 0, `Count: ${notifsA.length}`);

  // Test 24 — Get unread count
  res = await req('/api/notifications/unread-count', { token: tokenA });
  const unreadCount = res.data?.data?.count;
  assert('Test 24', 'Get unread count for User A', res.status === 200 && typeof unreadCount === 'number' && unreadCount > 0, `unreadCount: ${unreadCount}`);

  // Test 25 — Get only unread notifications
  res = await req('/api/notifications?isRead=false', { token: tokenA });
  const unreadList = res.data?.data?.notifications || [];
  assert('Test 25', 'Get unread notifications matches unreadCount', res.status === 200 && unreadList.length === unreadCount, `List count: ${unreadList.length}, unreadCount: ${unreadCount}`);
  const notifId = unreadList[0]?.id;

  // Test 26 — Mark one notification as read
  res = await req(`/api/notifications/${notifId}/read`, {
    method: 'PATCH',
    token: tokenA,
  });
  assert('Test 26', 'Mark one notification as read (200, isRead: true)', res.status === 200 && res.data?.data?.notification?.isRead === true, `Status: ${res.status}`);

  // Test 27 — Verify unread count decreased by 1
  res = await req('/api/notifications/unread-count', { token: tokenA });
  const newUnreadCount = res.data?.data?.count;
  assert('Test 27', `Verify unread count decreased by 1 (expected: ${unreadCount - 1}, got: ${newUnreadCount})`, res.status === 200 && newUnreadCount === unreadCount - 1, `Count: ${newUnreadCount}`);

  // Test 28 — Mark all notifications as read
  res = await req('/api/notifications/read-all', {
    method: 'PATCH',
    token: tokenA,
  });
  const updatedCount = res.data?.data?.updatedCount;
  assert('Test 28', 'Mark all notifications as read (updatedCount >= 1)', res.status === 200 && updatedCount >= 1, `updatedCount: ${updatedCount}`);

  // Test 28 Repeat — Mark all as read again (updatedCount = 0)
  res = await req('/api/notifications/read-all', {
    method: 'PATCH',
    token: tokenA,
  });
  assert('Test 28 Repeat', 'Mark all as read again returns updatedCount: 0', res.status === 200 && res.data?.data?.updatedCount === 0, `updatedCount: ${res.data?.data?.updatedCount}`);

  console.log('\n--- PART 6: NOTIFICATION OWNERSHIP (Test 29) ---');
  // Get User B notification
  res = await req('/api/notifications', { token: tokenB });
  const notifsB = res.data?.data?.notifications || [];
  const userBNotifId = notifsB[0]?.id;
  assert('Setup Part 6', 'Get User B notification ID', !!userBNotifId, `ID: ${userBNotifId}`);

  // Test 29 — User A tries to modify User B notification (Expect 404)
  res = await req(`/api/notifications/${userBNotifId}/read`, {
    method: 'PATCH',
    token: tokenA,
  });
  assert('Test 29', 'User A modifying User B notification returns 404 (not 403)', res.status === 404, `Status: ${res.status}`);

  console.log('\n--- PART 7: ADMIN REMINDERS (Tests 30–32) ---');
  // Test 30 — Promote User A to admin directly in MongoDB
  const updateRes = await db.collection('users').updateOne(
    { email: 'usera@example.com' },
    { $set: { role: 'admin' } }
  );
  assert('Test 30', 'Promote User A to admin in DB', updateRes.modifiedCount === 1, `modified: ${updateRes.modifiedCount}`);

  // Test 31 — Non-admin (User B) runs reminder scan (Expect 403)
  res = await req('/api/notifications/run-reminders', {
    method: 'POST',
    token: tokenB,
  });
  assert('Test 31', 'Non-admin reminder request returns 403 Forbidden', res.status === 403, `Status: ${res.status}`);

  // Test 32 — Admin (User A) runs reminder scan
  res = await req('/api/notifications/run-reminders', {
    method: 'POST',
    token: tokenA,
  });
  assert('Test 32', 'Admin runs reminder scan (200 OK)', res.status === 200 && typeof res.data?.data?.dueSoonCreated === 'number', `Summary: ${JSON.stringify(res.data?.data)}`);

  console.log('\n--- PART 8: ACTUALLY TEST REMINDERS & DUPLICATE CHECK (Tests 33–35) ---');
  // Setup throwaway active loan
  res = await req('/api/items', {
    method: 'POST',
    token: tokenA,
    body: {
      title: 'Throwaway Projector',
      description: 'Projector for reminder test',
      category: 'electronics',
      condition: 'good',
      creditCost: 1,
    },
  });
  const throwawayItemId = res.data?.data?.item?.id;

  res = await req('/api/borrow-requests', {
    method: 'POST',
    token: tokenB,
    body: {
      itemId: throwawayItemId,
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      message: 'Reminder test loan',
    },
  });
  const throwawayReqId = res.data?.data?.borrowRequest?.id;

  res = await req(`/api/borrow-requests/${throwawayReqId}/approve`, {
    method: 'PATCH',
    token: tokenA,
  });
  const throwawayLoanId = res.data?.data?.loan?.id;
  assert('Setup Part 8', 'Created throwaway active loan', !!throwawayLoanId, `Loan ID: ${throwawayLoanId}`);

  // Set throwaway loan endDate to tomorrow (UTC)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);

  await db.collection('loans').updateOne(
    { _id: new mongoose.Types.ObjectId(throwawayLoanId) },
    { $set: { endDate: tomorrowUTC, status: 'active' } }
  );

  // Test 33 — Run reminder scan (Expect dueSoonCreated >= 1)
  res = await req('/api/notifications/run-reminders', {
    method: 'POST',
    token: tokenA,
  });
  const dueSoonCreated = res.data?.data?.dueSoonCreated;
  assert('Test 33', 'Run reminder scan creates due-soon notification (dueSoonCreated >= 1)', res.status === 200 && dueSoonCreated >= 1, `dueSoonCreated: ${dueSoonCreated}`);

  // Test 34 — Check borrower's reminder notification
  res = await req('/api/notifications', { token: tokenB });
  const notifsAfterReminder = res.data?.data?.notifications || [];
  const reminderNotif = notifsAfterReminder.find(n => n.type === 'loan_due_soon' && n.relatedEntityId === throwawayLoanId);
  assert('Test 34', 'Borrower receives loan_due_soon notification', !!reminderNotif, `Reminder found: ${JSON.stringify(reminderNotif)}`);

  // Test 35 — Final Duplicate Reminder Test: Run reminder scan again
  res = await req('/api/notifications/run-reminders', {
    method: 'POST',
    token: tokenA,
  });
  const dueSoonCreated2 = res.data?.data?.dueSoonCreated;
  const overdueCreated2 = res.data?.data?.overdueCreated;
  assert('Test 35A', 'Run reminder scan again creates 0 duplicates (dueSoonCreated: 0, overdueCreated: 0)', res.status === 200 && dueSoonCreated2 === 0 && overdueCreated2 === 0, `dueSoon: ${dueSoonCreated2}, overdue: ${overdueCreated2}`);

  // Verify borrower still has only 1 reminder notification for that loan
  res = await req('/api/notifications', { token: tokenB });
  const allRemindersForLoan = (res.data?.data?.notifications || []).filter(n => n.type === 'loan_due_soon' && n.relatedEntityId === throwawayLoanId);
  assert('Test 35B', 'Borrower still has exactly 1 reminder notification for the loan', allRemindersForLoan.length === 1, `Count: ${allRemindersForLoan.length}`);

  console.log('\n' + '='.repeat(70));
  console.log(`TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('='.repeat(70));

  await mongoose.disconnect();
  process.exit(failedCount > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
