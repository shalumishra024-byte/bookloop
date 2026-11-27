import http from 'http';
import app from '../server/src/server.js';

const PORT = 5055;

function req(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, data: raw ? JSON.parse(raw) : null });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw });
          }
        });
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

async function run() {
  const server = app.listen(PORT);
  console.log(`\nRunning RBAC & Security Verification Suite on port ${PORT}...\n`);

  try {
    // 1. Unauthenticated requests rejected
    const unauthMe = await req('GET', '/api/auth/me?email=librarian@college.edu');
    assert(unauthMe.status === 401, `Unauthenticated /api/auth/me?email=... rejected (${unauthMe.status})`);

    const unauthStudents = await req('GET', '/api/students');
    assert(unauthStudents.status === 401, `Unauthenticated /api/students rejected (${unauthStudents.status})`);

    // 2. Public signup attempting LIBRARIAN role rejected
    const badSignup = await req('POST', '/api/auth/register', {
      fullName: 'Hacker',
      email: `hacker.${Date.now()}@college.edu`,
      password: 'password123',
      studentId: `HACK-${Date.now()}`,
      role: 'LIBRARIAN',
    });
    assert(badSignup.status === 403, `Public signup with role=LIBRARIAN rejected (${badSignup.status})`);

    // 3. Valid student signup & login
    const stuEmail = `rbac.test.${Date.now()}@college.edu`;
    const stuSignup = await req('POST', '/api/auth/register', {
      fullName: 'RBAC Test Student',
      email: stuEmail,
      password: 'password123',
      studentId: `RBAC-${Date.now()}`,
      department: 'Computer Science & Engineering',
      academicYear: '2nd Year',
      semester: '3rd Semester',
      collegeAffiliation: 'Main Campus',
    });
    assert(stuSignup.status === 201 && stuSignup.data.user.role === 'STUDENT', `Student signup assigned STUDENT role`);
    const stuToken = stuSignup.data.token;
    const stuProfileId = stuSignup.data.profile.id;

    // 4. Student trying librarian endpoints -> 403
    const stuGetStudents = await req('GET', '/api/students', undefined, stuToken);
    assert(stuGetStudents.status === 403, `Student blocked from /api/students (${stuGetStudents.status})`);

    const stuLibStats = await req('GET', '/api/stats/librarian', undefined, stuToken);
    assert(stuLibStats.status === 403, `Student blocked from /api/stats/librarian (${stuLibStats.status})`);

    const stuAddBook = await req('POST', '/api/books', { title: 'Fake' }, stuToken);
    assert(stuAddBook.status === 403, `Student blocked from POST /api/books (${stuAddBook.status})`);

    const stuCreateLib = await req('POST', '/api/admin/librarians', { email: 'x@y.com', name: 'X' }, stuToken);
    assert(stuCreateLib.status === 403, `Student blocked from POST /api/admin/librarians (${stuCreateLib.status})`);

    // 5. Student trying to escalate role via profile update -> 403
    const stuEscalate = await req('PUT', `/api/auth/profile/${stuProfileId}`, { role: 'LIBRARIAN' }, stuToken);
    assert(stuEscalate.status === 403, `Student blocked from escalating role via profile API (${stuEscalate.status})`);

    // 6. Student trying to modify another student's profile -> 403
    const alexLogin = await req('POST', '/api/auth/login', { email: 'alex.rivera@college.edu', password: 'password123' });
    const alexProfileId = alexLogin.data.profile.id;
    const stuEditOther = await req('PUT', `/api/auth/profile/${alexProfileId}`, { department: 'Hacked' }, stuToken);
    assert(stuEditOther.status === 403, `Student blocked from editing another student's profile (${stuEditOther.status})`);

    // 7. Wrong password rejected (no password123 backdoor)
    const wrongPass = await req('POST', '/api/auth/login', { email: stuEmail, password: 'wrongpassword' });
    assert(wrongPass.status === 401, `Wrong password rejected (${wrongPass.status})`);

    // 8. Librarian login & role verification
    const libLogin = await req('POST', '/api/auth/login', { email: 'librarian@college.edu', password: 'password123' });
    assert(
      libLogin.status === 200 && libLogin.data.user.role === 'LIBRARIAN' && !!libLogin.data.librarianProfile,
      `Librarian login verified LIBRARIAN role and LibrarianProfile (${libLogin.data.librarianProfile?.librarianId})`
    );
    const libToken = libLogin.data.token;

    const libGetStudents = await req('GET', '/api/students', undefined, libToken);
    assert(libGetStudents.status === 200 && Array.isArray(libGetStudents.data), `Librarian allowed on /api/students (${libGetStudents.status})`);

    const libBorrow = await req('POST', '/api/borrow/requests', { bookId: 'book-1' }, libToken);
    assert(libBorrow.status === 403, `Librarian blocked from student-only POST /api/borrow/requests (${libBorrow.status})`);

    console.log('\n=== ALL 12 RBAC & SECURITY CHECKS PASSED ===\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
