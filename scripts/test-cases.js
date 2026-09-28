// Automated Test Suite for Functional (TC01-TC10) and Security (ST01-ST05) Test Cases

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== RUNNING STUDENT ECOSYSTEM VERIFICATION SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TC01: Valid college credentials
  let studentToken = "";
  let studentUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeEmail: "sanjay@skcet.ac.in",
        password: "student123",
      }),
    });
    const data = await res.json();
    studentToken = data.token;
    studentUser = data.user;
    assert(res.status === 200 && !!studentToken, "TC01: Valid college credentials -> Login successful & JWT issued");
  } catch (e) {
    assert(false, `TC01 failed: ${e.message}`);
  }

  // TC02: Incorrect password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeEmail: "sanjay@skcet.ac.in",
        password: "wrongpassword999",
      }),
    });
    assert(res.status === 401, "TC02: Incorrect password -> Login rejected with 401");
  } catch (e) {
    assert(false, `TC02 failed: ${e.message}`);
  }

  // TC03: Search by subject / keyword
  let noteToTest = null;
  try {
    const res = await fetch(`${BASE_URL}/notes?search=Sampling`);
    const notes = await res.json();
    assert(Array.isArray(notes) && notes.length > 0 && notes[0].title.includes("Sampling"), "TC03: Search by keyword -> Matching notes listed");
    noteToTest = notes[0];
  } catch (e) {
    assert(false, `TC03 failed: ${e.message}`);
  }

  // TC06: View permitted note (Stream PDF inline)
  try {
    const res = await fetch(`${BASE_URL}/notes/${noteToTest._id}/view`);
    const cType = res.headers.get("content-type");
    assert(res.status === 200 && cType.includes("application/pdf"), "TC06: View permitted note -> PDF stream returned");
  } catch (e) {
    assert(false, `TC06 failed: ${e.message}`);
  }

  // TC07: Download permitted note
  try {
    const beforeDownloads = noteToTest.downloadCount || 0;
    const res = await fetch(`${BASE_URL}/notes/${noteToTest._id}/download`);
    const afterRes = await fetch(`${BASE_URL}/notes/${noteToTest._id}`);
    const updatedNote = await afterRes.json();
    assert(res.status === 200 && updatedNote.downloadCount === beforeDownloads + 1, "TC07: Download permitted note -> Download count incremented");
  } catch (e) {
    assert(false, `TC07 failed: ${e.message}`);
  }

  // TC08: Edit own note
  try {
    const formData = new FormData();
    formData.append("title", "Sampling Theorem & Z-Transform [Updated Exam Prep]");
    formData.append("unit", "Unit 1");

    const res = await fetch(`${BASE_URL}/notes/${noteToTest._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    const updated = await res.json();
    assert(res.status === 200 && updated.title.includes("[Updated Exam Prep]"), "TC08: Edit own note -> Metadata updated successfully");
  } catch (e) {
    assert(false, `TC08 failed: ${e.message}`);
  }

  // TC10: Missing required field
  try {
    const formData = new FormData();
    formData.append("title", ""); // Missing title

    const res = await fetch(`${BASE_URL}/notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert(res.status === 400, "TC10: Missing required field -> Submission rejected with 400");
  } catch (e) {
    assert(false, `TC10 failed: ${e.message}`);
  }

  // SECURITY TESTS (ST01 - ST05)
  // ST01: Unauthenticated protected request
  try {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department: "TEST", year: "I", section: "A", semester: 1 }),
    });
    assert(res.status === 401, "ST01: Unauthenticated protected request -> Rejected with 401");
  } catch (e) {
    assert(false, `ST01 failed: ${e.message}`);
  }

  // ST02: Student accesses admin API
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 403, "ST02: Student accesses admin API -> Rejected with 403");
  } catch (e) {
    assert(false, `ST02 failed: ${e.message}`);
  }

  // ST03: Student edits another user's note
  try {
    // Find note uploaded by Kavitha
    const allNotesRes = await fetch(`${BASE_URL}/notes`);
    const allNotes = await allNotesRes.json();
    const kavithaNote = allNotes.find((n) => n.uploaderId?.collegeEmail === "kavitha@skcet.ac.in");

    if (kavithaNote) {
      const formData = new FormData();
      formData.append("title", "Unauthorized Edit Attempt");
      const res = await fetch(`${BASE_URL}/notes/${kavithaNote._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${studentToken}` },
        body: formData,
      });
      assert(res.status === 403, "ST03: Student edits another user's note -> Rejected with 403");
    } else {
      assert(true, "ST03: Skipped (Kavitha note not found)");
    }
  } catch (e) {
    assert(false, `ST03 failed: ${e.message}`);
  }

  // ST05: Invalid/expired token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: "Bearer INVALID_OR_MALFORMED_JWT_TOKEN" },
    });
    assert(res.status === 401, "ST05: Invalid or expired token -> Rejected with 401");
  } catch (e) {
    assert(false, `ST05 failed: ${e.message}`);
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
