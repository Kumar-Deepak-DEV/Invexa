const testAuth = async () => {
  try {
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alex Rivera',
        loginId: 'alex.rivera',
        email: 'alex.rivera@stocksense.io',
        password: 'Admin@123',
        role: 'Inventory Manager'
      })
    });
    const signupData = await signupRes.json();
    console.log('Signup status:', signupRes.status, signupData);

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'alex.rivera',
        password: 'Admin@123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, loginData);
  } catch (err) {
    console.error('Error:', err);
  }
};

testAuth();
