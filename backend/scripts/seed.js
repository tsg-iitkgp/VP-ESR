/**
 * DEV / QA ONLY — wipes all bookings and inserts synthetic data.
 *
 * Run from backend root: `npm run seed` (requires MONGODB_URI in .env)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Booking } from "../models/booking.models.js";
import { DB_NAME } from "../constant.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER VARIABLES — tweak these for UI / timeline testing
// ═══════════════════════════════════════════════════════════════════════════

/** First calendar day to seed (inclusive), ISO `YYYY-MM-DD` */
const SEED_START_DATE = "2026-04-06";

/** Last calendar day to seed (inclusive), ISO `YYYY-MM-DD` */
const SEED_END_DATE = "2026-04-20";

/**
 * Booking density: multiplier on base bookings per room per day.
 * `1.0` ≈ moderate; `0.3` sparse; `2.0` busy (capped by available 30-min slots).
 */
const BOOKING_DENSITY = 2.0;

/** Target bookings per room per day before density (then rounded & clamped). */
const BASE_BOOKINGS_PER_ROOM_PER_DAY = 6;

/** How many distinct booker names to rotate through (random picks each booking). */
const NUM_USERS = 16;

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN LISTS — portfolio × reason are mixed into title / description
// ═══════════════════════════════════════════════════════════════════════════

const PORTFOLIOS = [
  "Academics",
  "Gymkhana",
  "BSP",
  "Technical",
  "Cultural",
  "Sports",
  "Welfare",
  "Hostel Affairs",
  "Research & PG",
  "International Relations",
  "Sustainability",
  "Alumni Cell",
];

const REASONS = [
  "Senate preparation",
  "Executive committee sync",
  "Budget review",
  "Club charter discussion",
  "Event debrief",
  "Vendor / sponsor call",
  "Mentor office hours",
  "Inter-hostel coordination",
  "Policy drafting session",
  "Stakeholder interview",
  "Crisis / incident response",
  "Orientation planning",
  "Equipment handover",
  "Partnership MoU discussion",
  "Workshop dry run",
  "Press / comms briefing",
];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Neha", "Priya",
  "Rahul", "Rohan", "Sneha", "Vikram", "Aditya", "Meera", "Kabir", "Tara",
  "Dev", "Riya", "Yash", "Pooja",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Iyer", "Reddy", "Menon", "Das", "Ghosh",
  "Singh", "Khan", "Joshi", "Nair", "Kapoor", "Malhotra", "Bose", "Choudhury",
];

const ROOMS = ["esr", "vp"];

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Build users: prefer unique-ish names up to pool size, then numbered fallbacks. */
function buildUserPool(n) {
  const pool = [];
  const seen = new Set();
  let guard = 0;
  while (pool.length < n && guard < n * 20) {
    guard++;
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (seen.has(name)) continue;
    seen.add(name);
    pool.push(name);
  }
  while (pool.length < n) {
    pool.push(`Seed Tester ${pool.length + 1}`);
  }
  return pool;
}

function partsToYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Gregorian Y-M-D iteration (no server-TZ dependence). */
function enumerateDatesInclusive(startYmd, endYmd) {
  const parse = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return { y, m, d };
  };
  let { y, m, d } = parse(startYmd);
  const end = parse(endYmd);
  const stamp = (p) => p.y * 10_000 + p.m * 100 + p.d;
  if (stamp({ y, m, d }) > stamp(end)) {
    throw new Error("SEED_START_DATE must be on or before SEED_END_DATE");
  }
  const dates = [];
  for (;;) {
    if (stamp({ y, m, d }) > stamp(end)) break;
    dates.push(partsToYmd(y, m, d));
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    y = next.getUTCFullYear();
    m = next.getUTCMonth() + 1;
    d = next.getUTCDate();
  }
  return dates;
}

/** Same wall-clock semantics as API: IST (+05:30) for a calendar day string. */
function istAt(dateYmd, hour, minute) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${dateYmd}T${hh}:${mm}:00+05:30`);
}

/**
 * Compose title + optional description from one portfolio + one reason
 * using several patterns so the UI sees varied strings.
 */
function composeTexts(portfolio, reason) {
  const roll = Math.random();
  let title;
  if (roll < 0.22) title = `${portfolio} · ${reason}`;
  else if (roll < 0.44) title = `${reason} (${portfolio})`;
  else if (roll < 0.66) title = `${portfolio} — ${reason}`;
  else if (roll < 0.82) title = `${reason}`;
  else title = `${pick(["Meeting", "Session", "Review", "Sync"])}: ${portfolio} / ${reason}`;

  let description;
  const dRoll = Math.random();
  if (dRoll < 0.28) {
    description = undefined;
  } else if (dRoll < 0.55) {
    description = `Portfolio: ${portfolio}. Purpose: ${reason}.`;
  } else if (dRoll < 0.78) {
    description = `${reason} — coordinated under ${portfolio}.`;
  } else {
    description = `${portfolio}: ${reason}. ${pick([
      "Open agenda.",
      "Follow-up TBD.",
      "Minutes to be shared.",
      "Invitees notified.",
    ])}`;
  }

  return { title, description };
}

function generateDayBookingsForRoom(dateYmd, room, users, bookingsTarget) {
  const bookings = [];
  const totalSlots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  const taken = new Array(totalSlots).fill(false);

  let placed = 0;
  let attempts = 0;

  while (placed < bookingsTarget && attempts < 200) {
    attempts++;

    const durationSlots = randInt(1, 3);
    const maxStart = totalSlots - durationSlots;
    if (maxStart < 0) break;

    const startSlot = randInt(0, maxStart);
    let free = true;
    for (let s = startSlot; s < startSlot + durationSlots; s++) {
      if (taken[s]) {
        free = false;
        break;
      }
    }
    if (!free) continue;

    for (let s = startSlot; s < startSlot + durationSlots; s++) {
      taken[s] = true;
    }

    const startMinutes = DAY_START_HOUR * 60 + startSlot * SLOT_MINUTES;
    const endMinutes = startMinutes + durationSlots * SLOT_MINUTES;

    const startH = Math.floor(startMinutes / 60);
    const startM = startMinutes % 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const portfolio = pick(PORTFOLIOS);
    const reason = pick(REASONS);
    const { title, description } = composeTexts(portfolio, reason);

    bookings.push({
      name: pick(users),
      title,
      description,
      startTime: istAt(dateYmd, startH, startM),
      endTime: istAt(dateYmd, endH, endM),
      room,
    });

    placed++;
  }

  return bookings;
}

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  const users = buildUserPool(NUM_USERS);
  const dateList = enumerateDatesInclusive(SEED_START_DATE, SEED_END_DATE);

  const rawTarget = Math.round(BASE_BOOKINGS_PER_ROOM_PER_DAY * BOOKING_DENSITY);
  const maxSlotsPerRoom = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  const bookingsPerRoomPerDay = Math.max(0, Math.min(maxSlotsPerRoom, rawTarget));

  try {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to MongoDB");

    const deleted = await Booking.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing bookings (full wipe).`);

    const allBookings = [];
    for (const dateYmd of dateList) {
      for (const room of ROOMS) {
        allBookings.push(
          ...generateDayBookingsForRoom(dateYmd, room, users, bookingsPerRoomPerDay),
        );
      }
    }

    const created = await Booking.insertMany(allBookings);
    console.log(
      `\nInserted ${created.length} bookings across ${dateList.length} day(s), ` +
        `${ROOMS.length} room(s). Target/room/day (after density): ${bookingsPerRoomPerDay} ` +
        `(density=${BOOKING_DENSITY}, base=${BASE_BOOKINGS_PER_ROOM_PER_DAY}). Users in pool: ${users.length}.\n`,
    );

    const byDay = {};
    for (const b of created) {
      const dayKey = b.startTime.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(b);
    }

    for (const [day, bookings] of Object.entries(byDay).sort()) {
      console.log(`--- ${day} (${bookings.length} bookings) ---`);
      bookings
        .sort((a, b) => a.startTime - b.startTime)
        .forEach((b) => {
          const t = (d) =>
            d.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            });
          console.log(
            `  [${b.room.toUpperCase()}] ${t(b.startTime)}–${t(b.endTime)}  ${b.title} — ${b.name}`,
          );
        });
    }

    console.log("\nDone.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
