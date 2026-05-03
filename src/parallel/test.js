import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 20, // عدد المستخدمين الوهميين
  duration: '5s', // مدة الاختبار
};

export default function () {
  const url = 'http://localhost:3000/orders/safe';

  const payload = JSON.stringify({
    userId: 2,
    items: [
      { productId: 5, quantity: 3 },
     // { productId: 1, quantity: 2 },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}
//k6 run test.js