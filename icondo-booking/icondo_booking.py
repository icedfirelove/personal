#!/usr/bin/env python3
"""
iCondo Automated Booking Script
Books tennis court (7pm–8pm SGT) every Thursday at midnight.
Cron: 0 0 * * 4  (Thursday midnight SGT)
"""

import os
import requests
import urllib3
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pytz

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── CONFIG ────────────────────────────────────────────────────────────────────

AUTH_TOKEN   = os.environ["ICONDO_AUTH_TOKEN"]
USER_ID      = os.environ["ICONDO_USER_ID"]
FACILITY_ID  = os.environ["ICONDO_FACILITY_ID"]
API_KEY      = os.environ["ICONDO_API_KEY"]
CONDO_ID     = os.environ["ICONDO_CONDO_ID"]
UNIT_ID      = os.environ["ICONDO_UNIT_ID"]
DEVICE_ID    = os.environ["ICONDO_DEVICE_ID"]
REGISTRAR_ID = os.environ["ICONDO_REGISTRAR_ID"]
AUTH_SIG_KEY  = os.environ["ICONDO_AUTH_SIG_KEY"]
AUTH_SIG_HASH = os.environ["ICONDO_AUTH_SIG_HASH"]
AUTH_SIG_DATE = os.environ["ICONDO_AUTH_SIG_DATE"]

TARGET_START = "19:00:00"
TARGET_END   = "20:00:00"

HEADERS = {
    "Authorization":    f"Bearer {AUTH_TOKEN}",
    "Content-Type":     "application/json",
    "Accept":           "application/json",
    "Accept-Encoding":  "br;q=1.0, gzip;q=0.9, deflate;q=0.8",
    "Accept-Language":  "en-SG;q=1.0, zh-Hans-SG;q=0.9, ko-SG;q=0.8, ja-SG;q=0.7, zh-Hant-SG;q=0.6",
    "User-Agent":       "mobile",
    "device-os":        "iOS",
    "device-name":      "iPhone",
    "device-model":     "iPhone16,1 (iPhone 15 Pro)",
    "os-version":       "26.2",
    "app-version":      "245",
    "build-version":    "3.2.66.1",
    "api-key":          API_KEY,
    "condo-id":         CONDO_ID,
    "unit-id":          UNIT_ID,
    "device-id":        DEVICE_ID,
    "registrar-id":     REGISTRAR_ID,
    "sandbox":          "0",
    "x-icd-date":       AUTH_SIG_DATE,
    "x-auth-signature": f"ICD {AUTH_SIG_KEY}:{AUTH_SIG_HASH}",
}

# ── DATE HELPERS ──────────────────────────────────────────────────────────────

def next_thursday_sgt():
    """Returns next Thursday as a date object in SGT."""
    SGT = pytz.timezone("Asia/Singapore")
    today = datetime.now(SGT).date()
    days_ahead = (3 - today.weekday()) % 7  # 3 = Thursday
    if days_ahead == 0:
        days_ahead = 7  # running on Thursday → target NEXT Thursday
    return today + timedelta(days=days_ahead)

def to_icondo_date(d):
    """Converts a SGT date to iCondo date param: previous day T16:00:00.000Z (= midnight SGT)."""
    prev = d - timedelta(days=1)
    return prev.strftime("%Y-%m-%dT16:00:00.000Z")

# ── CORE FUNCTIONS ────────────────────────────────────────────────────────────

def get_available_slot(icondo_date):
    """Queries slots API and returns the duration ID for 7pm if available, else None."""
    url = (f"https://services.icondo.asia/api/v1/facility/{FACILITY_ID}"
           f"/slots-available?excluded=wysiwyg&date={icondo_date}")
    try:
        resp = requests.get(url, headers=HEADERS, verify=False, timeout=15)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch slots: {e}")
        return None

    courts = resp.json()
    for court in courts:
        for slot in court.get("slotTime", []):
            for duration in slot.get("durations", []):
                if (duration["startTime"] == TARGET_START
                        and duration["stopTime"] == TARGET_END
                        and duration["isAvailable"]):
                    print(f"   Found available 7pm slot: {duration['id']}")
                    return duration["id"]

    return None

def make_booking():
    target_date = next_thursday_sgt()
    icondo_date = to_icondo_date(target_date)
    print(f"Target date : {target_date} (Thursday SGT)")
    print(f"iCondo date : {icondo_date}")
    print(f"Slot        : {TARGET_START} → {TARGET_END}")

    print("Checking availability...")
    duration_id = get_available_slot(icondo_date)
    if not duration_id:
        print("❌ No available 7pm slot found. Already taken or not yet released.")
        return False

    payload = {
        "bookingAddons": [],
        "cardToken": "",
        "date": icondo_date,
        "depositAmount": 0,
        "endTime": TARGET_END,
        "guestListMetadata": {
            "code": -1,
            "createdDate": "",
            "guestList": [],
            "guestListMessage": "Please provide an accurate guest list\nPlease include yourself and members of your household\nMaximum 8 Pax as per BCA regulations",
            "hasGuestList": False,
            "id": "",
            "isEnable": True,
            "maxGuestNumber": 1,
            "message": "",
            "status": True,
            "title": "oops!",
            "updatedDate": "",
            "value": "",
            "valueLink": ""
        },
        "listDurationId": [duration_id],
        "note": "",
        "noteToManagement": "",
        "paymentAmount": 0,
        "startTime": TARGET_START,
        "totalAmount": 0,
        "userId": USER_ID,
    }

    try:
        resp = requests.post(
            "https://services.icondo.asia/api/v1/booking?excluded=wysiwyg",
            json=payload, headers=HEADERS, timeout=15, verify=False
        )
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False

    try:
        data = resp.json()
    except Exception:
        data = resp.text

    if resp.status_code in (200, 201):
        print(f"✅ Booking SUCCESSFUL! (HTTP {resp.status_code})")
        print(f"   Booking ID : {data.get('id', 'N/A')}")
        txn = data.get("paymentTransaction", [{}])[0]
        print(f"   Facility   : {txn.get('paymentName', 'N/A')}")
        print(f"   Date       : {target_date}  {TARGET_START}–{TARGET_END} SGT")
        return True
    else:
        print(f"❌ Booking FAILED (HTTP {resp.status_code})")
        print(data)
        return False

if __name__ == "__main__":
    make_booking()
