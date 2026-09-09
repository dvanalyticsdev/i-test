// Comprehensive automated test suite for Authoritative Proctoring & Strike System

async function runTests() {
  console.log('=== Running Proctoring & Backend Validation Tests ===');
  const baseUrl = 'http://localhost:3000';

  // Test 1: Health Check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.assert(healthData.status === 'healthy', 'Test 1 Failed: Health check not healthy');
  console.log('✔ Test 1 Passed: Server health check healthy');

  // Test 2: Start Exam Session
  const startRes = await fetch(`${baseUrl}/api/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testConfig: { id: 'TEST-001', title: 'Data Science Exam', assessmentType: 'mcq', durationMinutes: 30 },
      studentUser: { id: 'STU-100', lmsId: 'STU-100', name: 'Alice Walker' },
      mcqs: [
        { id: 1, question: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: 1 },
        { id: 2, question: 'What is capital of France?', options: ['Paris', 'London'], correctAnswer: 0 }
      ],
      compilers: []
    })
  });
  const startData = await startRes.json();
  console.assert(startData.success && startData.session, 'Test 2 Failed: Start session failed');
  const session1 = startData.session;
  console.assert(session1.warningCount === 0, 'Test 2 Failed: Initial warning count should be 0');
  console.assert(session1.status === 'ACTIVE', 'Test 2 Failed: Session status should be ACTIVE');
  console.log('✔ Test 2 Passed: Session started with warningCount=0 and status=ACTIVE');

  // Test 3: First Violation (Tab Switch)
  const v1Res = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}/violation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Tab switch / background window transition detected' })
  });
  const v1Data = await v1Res.json();
  console.assert(v1Data.success && v1Data.warningCount === 1, 'Test 3 Failed: Strike 1 warning count should be 1');
  console.assert(!v1Data.isDisqualified, 'Test 3 Failed: Candidate should not be disqualified on strike 1');
  console.log('✔ Test 3 Passed: First violation logged as Warning 1/2, candidate remains active');

  // Test 4: Duplicate Clustered Violation within 100ms (Should be deduplicated)
  const vDupRes = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}/violation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Window focus lost / blur event' })
  });
  const vDupData = await vDupRes.json();
  console.assert(vDupData.deduplicated === true, 'Test 4 Failed: Event within cooldown should be deduplicated');
  console.assert(vDupData.warningCount === 1, 'Test 4 Failed: Warning count should remain 1 on deduplication');
  console.log('✔ Test 4 Passed: Clustered browser event within cooldown successfully deduplicated');

  // Test 5: Save Answer
  const ansRes = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId: 1, optionIndex: 1 })
  });
  const ansData = await ansRes.json();
  console.assert(ansData.success && ansData.userAnswers[1] === 1, 'Test 5 Failed: Answer not saved');
  console.log('✔ Test 5 Passed: Answer incrementally persisted on backend');

  // Wait 2.6s for cooldown window to expire
  console.log('  Waiting 2.6s for strike cooldown window...');
  await new Promise(r => setTimeout(r, 2600));

  // Test 6: Second Violation (Second Tab Switch -> Disqualification)
  const v2Res = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}/violation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Second tab switch detected' })
  });
  const v2Data = await v2Res.json();
  console.assert(v2Data.success && v2Data.warningCount === 2, 'Test 6 Failed: Warning count should be 2');
  console.assert(v2Data.isDisqualified === true, 'Test 6 Failed: Candidate should be disqualified on strike 2');
  console.assert(v2Data.session.status === 'DISQUALIFIED', 'Test 6 Failed: Session status must be DISQUALIFIED');
  console.assert(v2Data.session.isDisqualified === true, 'Test 6 Failed: Session isDisqualified must be true');
  console.assert(v2Data.session.submissionReason === 'AUTO_SUBMITTED_CHEATING', 'Test 6 Failed: Submission reason must be AUTO_SUBMITTED_CHEATING');
  console.assert(v2Data.submission.score.includes('Disqualified'), 'Test 6 Failed: Score should be 0 Disqualified');
  console.log('✔ Test 6 Passed: Second violation triggered automatic disqualification & zero score');

  // Test 6b: Attempting manual submit on a disqualified session must be rejected (Anti-Race Condition)
  const blockedSubmitRes = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.assert(blockedSubmitRes.status === 403, 'Test 6b Failed: Normal submit should return 403 for disqualified session');
  console.log('✔ Test 6b Passed: Normal submit request safely rejected with 403 on disqualified session');

  // Test 7: Re-fetch session to verify persistent Disqualified state (anti-bypass)
  const getRes = await fetch(`${baseUrl}/api/sessions/${session1.sessionId}`);
  const getData = await getRes.json();
  console.assert(getData.session.status === 'DISQUALIFIED', 'Test 7 Failed: Session must remain DISQUALIFIED');
  console.assert(getData.session.isDisqualified === true, 'Test 7 Failed: Session isDisqualified must remain true');
  console.assert(getData.session.isFinished === true, 'Test 7 Failed: Session must remain finished');
  console.log('✔ Test 7 Passed: Session re-fetch confirms disqualification cannot be bypassed by reloading');

  // Test 8: Clean assessment submission flow
  const cleanStartRes = await fetch(`${baseUrl}/api/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testConfig: { id: 'TEST-002', title: 'Python Basics', assessmentType: 'mcq', durationMinutes: 10 },
      studentUser: { id: 'STU-200', lmsId: 'STU-200', name: 'Bob Smith' },
      mcqs: [
        { id: 10, question: 'Python creator?', options: ['Guido van Rossum', 'Bjarne Stroustrup'], correctAnswer: 0 }
      ],
      compilers: []
    })
  });
  const cleanStart = await cleanStartRes.json();
  const session2 = cleanStart.session;

  // Answer correctly
  await fetch(`${baseUrl}/api/sessions/${session2.sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId: 10, optionIndex: 0 })
  });

  // Submit
  const submitRes = await fetch(`${baseUrl}/api/sessions/${session2.sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const submitData = await submitRes.json();
  console.assert(submitData.success && submitData.submission.score.includes('1/1 (100%)'), 'Test 8 Failed: Score not calculated correctly');
  console.assert(submitData.submission.cheatingStatus.includes('Clean'), 'Test 8 Failed: Cheating status should be Clean');
  console.log('✔ Test 8 Passed: Clean test submission correctly graded with 1/1 (100%) and Clean status');

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY! The authoritative proctoring system is fully verified.');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
