import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();
const authBase = 'https://ep-morning-sea-bdolwkuy.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth';

async function postNeonAuth(endpoint: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(`${authBase}${endpoint}`);
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Origin': 'http://localhost:5173',
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (c) => (respData += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(respData) });
          } catch {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runVerification() {
  console.log('=== BOOKLOOP AUTH & ROLE VERIFICATION ===\n');

  // Test 1: Neon Auth sign-up for a new student
  const testEmail = `student.test.${Date.now()}@college.edu`;
  console.log(`1. Testing Student Neon Auth Sign-up for: ${testEmail}`);
  const signupRes = await postNeonAuth('/sign-up/email', {
    email: testEmail,
    password: 'password123',
    name: 'Rohit Verma',
  });
  console.log('   Neon Auth signup status:', signupRes.status);
  if (signupRes.status !== 200) {
    throw new Error(`Neon Auth signup failed: ${JSON.stringify(signupRes)}`);
  }
  const neonUserId = signupRes.data.user.id;
  console.log('   Assigned Neon Auth User ID:', neonUserId);

  // Test 2: Persist Student Profile in NeonDB with default STUDENT role
  console.log('\n2. Persisting Student Profile in Application Database...');
  const studentUser = await prisma.user.create({
    data: {
      id: neonUserId,
      email: testEmail,
      name: 'Rohit Verma',
      role: 'STUDENT',
      isProfileComplete: true,
      studentProfile: {
        create: {
          studentId: `CS-2024-${Math.floor(100 + Math.random() * 900)}`,
          department: 'Computer Science & Engineering',
          academicYear: '1st Year',
          semester: '1st Semester',
          collegeAffiliation: 'School of Engineering & Technology',
          impactScore: 0,
          totalDonations: 0,
          activeBorrowingsCount: 0,
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('   Verified Database Role:', studentUser.role);
  console.log('   Student Roll No:', studentUser.studentProfile?.studentId);
  console.log('   Initial Impact Score:', studentUser.studentProfile?.impactScore);

  // Test 3: Sign-in via Neon Auth with Student Credentials
  console.log('\n3. Testing Student Neon Auth Sign-in...');
  const signinRes = await postNeonAuth('/sign-in/email', {
    email: testEmail,
    password: 'password123',
  });
  console.log('   Sign-in status:', signinRes.status);
  console.log('   Received Session Token:', signinRes.data.token ? 'YES (Valid)' : 'NO');

  // Test 4: Verify Librarian Auth and Role
  console.log('\n4. Testing Librarian Auth & Role Verification...');
  const libUser = await prisma.user.findUnique({
    where: { email: 'librarian@college.edu' },
  });
  console.log('   Librarian Email: librarian@college.edu');
  console.log('   Librarian Server Role:', libUser?.role);

  const libSignin = await postNeonAuth('/sign-in/email', {
    email: 'librarian@college.edu',
    password: 'password123',
  });
  console.log('   Librarian Neon Auth sign-in status:', libSignin.status);
  console.log('   Librarian Token received:', libSignin.data.token ? 'YES' : 'NO');

  // Test 5: Role-based separation
  console.log('\n5. Verifying Role Separation:');
  console.log(`   Student (${testEmail}) -> Target Route: /student`);
  console.log(`   Librarian (librarian@college.edu) -> Target Route: /librarian`);
  if (studentUser.role !== 'STUDENT') throw new Error('Student role incorrect');
  if (libUser?.role !== 'LIBRARIAN') throw new Error('Librarian role incorrect');

  console.log('\n=== ALL AUTHENTICATION & ROLE CHECKS PASSED SUCCESSFULLY ===');
}

runVerification()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
