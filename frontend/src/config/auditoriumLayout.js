/**
 * Standard Theater Seating Layout Specification matching the full auditorium grid.
 * All seats are active and numbered across all rows (A to M).
 * No 'x' marks or dead blocks: every block is an active, bookable seat with a number.
 */

export const AUDITORIUM_SEATING_LAYOUT = [
  // Row A: 18 seats (1 to 18)
  {
    row: 'A',
    seats: Array.from({ length: 18 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row B: 16 seats (1 to 16)
  {
    row: 'B',
    seats: Array.from({ length: 16 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row C: 16 seats (1 to 16)
  {
    row: 'C',
    seats: Array.from({ length: 16 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row D: 16 seats (1 to 16)
  {
    row: 'D',
    seats: Array.from({ length: 16 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row E: 16 seats (1 to 16)
  {
    row: 'E',
    seats: Array.from({ length: 16 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row F: 6 seats (1 to 6)
  {
    row: 'F',
    seats: Array.from({ length: 6 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row G: 16 seats (1 to 16)
  {
    row: 'G',
    seats: Array.from({ length: 16 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
  },
  // Row H: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'H',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
  // Row I: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'I',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
  // Row J: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'J',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
  // Row K: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'K',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
  // Row L: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'L',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
  // Row M: Left Block (1-8), Aisle, Right Block (9-16)
  {
    row: 'M',
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 1, type: 'seat', num: i + 1 })),
      { col: 'aisle', type: 'aisle' },
      ...Array.from({ length: 8 }, (_, i) => ({ col: i + 9, type: 'seat', num: i + 9 })),
    ],
  },
];

/**
 * Helper to get list of all valid active seat codes (e.g. ['A1', 'A2', ... 'M16'])
 */
export function getAllActiveSeatIds() {
  const seats = [];
  AUDITORIUM_SEATING_LAYOUT.forEach((rowObj) => {
    rowObj.seats.forEach((seat) => {
      if (seat.type === 'seat' && seat.num !== undefined) {
        seats.push(`${rowObj.row}${seat.num}`);
      }
    });
  });
  return seats;
}
