# Order Expiration Cron

## What it does

- Runs every **10 minutes** using:
  - `@Cron('*/10 * * * *')`
- Finds orders where:
  - `status = PENDING`
  - `createdAt` is older than **30 minutes**
- Loads at most **50 orders** per run (`take: 50`)
- Processes cancellations in chunks of **8 concurrent orders**

## Processing model

- Orders are split into chunks of 8.
- Each chunk is processed with `Promise.all`.
- The next chunk starts only after the current chunk finishes.

## Important behavior

- The cron job **does not update inventory directly**.
- The cron job **does not implement race-condition logic**.
- The cron job only calls the existing order cancellation method:
  - `orderService.cancelOrder(orderId)`
- Inventory updates and atomic/race-safe behavior are expected to be handled inside that existing cancellation flow.

## Error handling

- Errors are handled per order (`try/catch` per item).
- One failed cancellation does not stop the rest of the batch.
- Logs are emitted for:
  - job start
  - found order count
  - batch start
  - per-order success
  - per-order failure
  - job finish

## Manual testing (development only)

If `NODE_ENV=development`, you can trigger the same logic manually:

- `POST /dev-test/cancel-expired-pending-orders`
