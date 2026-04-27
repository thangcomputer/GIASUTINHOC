import fetch from 'node-fetch';

async function test() {
  const r = await fetch('http://localhost:5000/api/progress/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: '675839b2c3d4e5f6a7b8c9d0', // fake id
      courseId: 'ban-phim',
      stepIndex: 0
    })
  });
  const data = await r.json();
  console.log('POST RESULT:', data);

  const r2 = await fetch('http://localhost:5000/api/progress/675839b2c3d4e5f6a7b8c9d0/ban-phim');
  const data2 = await r2.json();
  console.log('GET RESULT:', data2);
}
test();
