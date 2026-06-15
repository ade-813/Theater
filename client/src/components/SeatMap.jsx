// Groups the flat seat list returned by GET /api/seats into [rowLabel, seats[]]
// pairs, preserving the row/seat-number order the server already sorted by.
function groupByRow(seats) {
  const rows = []
  const seatsByRow = new Map()
  for (const seat of seats) {
    let rowSeats = seatsByRow.get(seat.row)
    if (!rowSeats) {
      rowSeats = []
      seatsByRow.set(seat.row, rowSeats)
      rows.push([seat.row, rowSeats])
    }
    rowSeats.push(seat)
  }
  return rows
}

function seatStatus(seat, ownSeatIds) {
  if (ownSeatIds.has(seat.id)) return 'own'
  return seat.status === 'reserved' ? 'reserved' : 'available'
}

const SEAT_SIZE = 28
const SEAT_GAP = 4
const SEAT_SPACING = SEAT_SIZE + SEAT_GAP

// Theatral curve: seats further from a row's center are pushed down, away
// from the stage. The radius shrinks row by row, so the curve deepens
// toward the back, fanning the whole map out like a real auditorium.
const BASE_CURVE_RADIUS = 1600
const CURVE_RADIUS_STEP = 80

// Stairs: rows accumulate extra spacing as they go back, like risers.
const BASE_ROW_GAP = 4
const ROW_GAP_STEP = 2

function seatCurveOffset(seatIndex, rowLength, rowIndex) {
  const center = (rowLength - 1) / 2
  const distance = Math.abs(seatIndex - center) * SEAT_SPACING
  const radius = BASE_CURVE_RADIUS - rowIndex * CURVE_RADIUS_STEP
  return (distance * distance) / (2 * radius)
}

function SeatMap({ seats, ownSeatIds = new Set() }) {
  if (seats.length === 0) return <p className="text-muted">Loading seat map...</p>

  // Render back-to-front (H..A): the curve/stairs grow with row index, so
  // the deepest rows end up at the top and the premium front rows (A, B)
  // sit at the bottom, closest to the "stage".
  const rows = groupByRow(seats).reverse()

  return (
    <div className="seat-map">
      {rows.map(([rowLabel, rowSeats], rowIndex) => (
        <div
          className="seat-row"
          key={rowLabel}
          style={{ marginBottom: BASE_ROW_GAP + rowIndex * ROW_GAP_STEP }}
        >
          <span className="seat-row-label">{rowLabel}</span>
          <div className="seat-row-seats" style={{ paddingBottom: seatCurveOffset(0, rowSeats.length, rowIndex) }}>
            {rowSeats.map((seat, seatIndex) => (
              <div
                key={seat.id}
                className={`seat seat-${seatStatus(seat, ownSeatIds)}${seat.category === 'premium' ? ' seat-premium' : ''}`}
                style={{ transform: `translateY(${seatCurveOffset(seatIndex, rowSeats.length, rowIndex)}px)` }}
                title={`${seat.row}${seat.number} - ${seat.category}${seat.status === 'reserved' ? ', reserved' : ', available'}`}
              >
                {seat.number}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="seat-legend">
        <span className="seat-legend-item">
          <span className="seat seat-available" aria-hidden="true" /> Available
        </span>
        <span className="seat-legend-item">
          <span className="seat seat-reserved" aria-hidden="true" /> Reserved
        </span>
        <span className="seat-legend-item">
          <span className="seat seat-own" aria-hidden="true" /> Your seat
        </span>
        <span className="seat-legend-item">
          <span className="seat seat-available seat-premium" aria-hidden="true" /> Premium (thicker border)
        </span>
      </div>
    </div>
  )
}

export default SeatMap
