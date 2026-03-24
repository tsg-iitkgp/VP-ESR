import mongoose from "mongoose";
import dotenv from "dotenv";
import { Booking } from "../models/booking.models.js";
import { DB_NAME } from "../constant.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in .env");
  process.exit(1);
}

// ─── TWEAK THESE ────────────────────────────────────────────
const DAYS_TO_SEED = 5; // how many days (starting today) to generate
const BOOKINGS_PER_ROOM_PER_DAY = 6; // target bookings per room per day
// ─────────────────────────────────────────────────────────────

const USERS = ["Shubham", "Ankit", "Priya", "Rahul", "Neha", "Vikram", "Sneha", "Arjun"];

const TITLES = [
  "Sprint Planning",
  "Design Review",
  "Backend Sync",
  "Client Demo",
  "1:1 with Manager",
  "QA Standup",
  "Architecture Discussion",
  "Interview - SDE2",
  "Retro",
  "Team Lunch Planning",
  "Brainstorming Session",
  "Code Review",
  "Incident Postmortem",
  "Product Roadmap",
  "Onboarding",
  "Knowledge Transfer",
];

const ROOMS = ["esr", "vp"];

// Bookings run 9 AM – 6 PM, slots are 30-min aligned, duration 30–90 min
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateDayBookings(dayOffset) {
  const bookings = [];

  for (const room of ROOMS) {
    // Build a timeline of available 30-min slots for this room
    const totalSlots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
    const taken = new Array(totalSlots).fill(false);

    let placed = 0;
    let attempts = 0;

    while (placed < BOOKINGS_PER_ROOM_PER_DAY && attempts < 100) {
      attempts++;

      // Random duration: 1–3 slots (30–90 min)
      const durationSlots = randInt(1, 3);
      // Pick a random start slot that fits
      const maxStart = totalSlots - durationSlots;
      if (maxStart < 0) break;
      const startSlot = randInt(0, maxStart);

      // Check if all needed slots are free
      let free = true;
      for (let s = startSlot; s < startSlot + durationSlots; s++) {
        if (taken[s]) { free = false; break; }
      }
      if (!free) continue;

      // Mark slots as taken
      for (let s = startSlot; s < startSlot + durationSlots; s++) {
        taken[s] = true;
      }

      const startMinutes = DAY_START_HOUR * 60 + startSlot * SLOT_MINUTES;
      const endMinutes = startMinutes + durationSlots * SLOT_MINUTES;

      const startTime = new Date();
      startTime.setDate(startTime.getDate() + dayOffset);
      startTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

      const endTime = new Date();
      endTime.setDate(endTime.getDate() + dayOffset);
      endTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

      bookings.push({
        name: pick(USERS),
        title: pick(TITLES),
        description: Math.random() > 0.3 ? `Seed booking for ${room.toUpperCase()} room` : undefined,
        startTime,
        endTime,
        room,
      });

      placed++;
    }
  }

  return bookings;
}

async function seed() {
  try {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to MongoDB");

    const deleted = await Booking.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing bookings`);

    const allBookings = [];
    for (let d = 0; d < DAYS_TO_SEED; d++) {
      allBookings.push(...generateDayBookings(d));
    }

    const created = await Booking.insertMany(allBookings);
    console.log(`\nInserted ${created.length} bookings across ${DAYS_TO_SEED} days (target: ${BOOKINGS_PER_ROOM_PER_DAY}/room/day)\n`);

    // Group by day for display
    const byDay = {};
    for (const b of created) {
      const dayKey = b.startTime.toLocaleDateString("en-IN");
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(b);
    }

    for (const [day, bookings] of Object.entries(byDay)) {
      console.log(`--- ${day} (${bookings.length} bookings) ---`);
      bookings
        .sort((a, b) => a.startTime - b.startTime)
        .forEach((b) => {
          const t = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
          console.log(`  [${b.room.toUpperCase()}] ${t(b.startTime)}–${t(b.endTime)}  ${b.title} — ${b.name}`);
        });
    }

    console.log("\nDone!");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
