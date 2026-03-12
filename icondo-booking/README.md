# iCondo Auto Booking

Automatically books a tennis court at 7pm–8pm SGT every Thursday via the iCondo API.

## Setup

1. **Install dependencies**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install requests pytz python-dotenv
   ```

2. **Configure credentials**
   ```bash
   cp .env.example .env
   ```
   Fill in `.env` with your values (captured via Proxyman from the iCondo iOS app).

3. **Run manually**
   ```bash
   venv/bin/python3 icondo_booking.py
   ```

## Scheduling (macOS)

Add a cron job to run every Thursday at midnight SGT:

```bash
crontab -e
```

Add this line (update paths as needed):
```
0 0 * * 4 /path/to/venv/bin/python3 /path/to/icondo_booking.py >> /path/to/icondo_booking.log 2>&1
```

Make sure your Mac is **awake** at midnight for the cron job to fire.

## How it works

1. Calculates next Thursday's date in SGT
2. Queries the iCondo slots API to find an available 7pm slot
3. Books the first available court
4. Logs success/failure

## Notes

- The `AUTH_TOKEN` (JWT) expires in September 2027 — update `.env` if you get 401 errors
- The `x-auth-signature` is a captured static value — if it expires, re-capture from Proxyman
