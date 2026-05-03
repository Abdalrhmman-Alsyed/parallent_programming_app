const axios = require('axios');

const URL = 'http://localhost:3000/orders/unsafe';

const body = {
  userId: 1,
  items: [{ productId: 1, quantity: 6 }],
};

async function run() {
  console.log('Starting race test...');

  const requests = [];

  for (let i = 0; i < 20; i++) {
    requests.push(
      axios.post(URL, body).catch((e) => e.response?.data || e.message),
    );
  }

  const results = await Promise.all(requests);

  console.log('Done');
  console.log(results.length, 'requests finished');
}

run();
