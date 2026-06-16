function SeatLegend({ showOwn = false, showSelected = false, showEditing = false }) {
  return (
    <div className="seat-legend">
      <span className="seat-legend-item">
        <span className="seat seat-available" aria-hidden="true" />
        Available
      </span>
      <span className="seat-legend-item">
        <span className="seat seat-reserved" aria-hidden="true" />
        Reserved
      </span>
      <span className="seat-legend-item">
        <span className="seat seat-available seat-premium" aria-hidden="true" />
        Premium
      </span>
      {showOwn && (
        <span className="seat-legend-item">
          <span className="seat seat-own" aria-hidden="true" />
          Your seat
        </span>
      )}
      {showSelected && (
        <span className="seat-legend-item">
          <span className="seat seat-selected" aria-hidden="true" />
          Selected
        </span>
      )}
      {showEditing && (
        <>
          <span className="seat-legend-item">
            <span className="seat seat-own" aria-hidden="true" />
            Editing
          </span>
          <span className="seat-legend-item">
            <span className="seat seat-selected" aria-hidden="true" />
            To add
          </span>
          <span className="seat-legend-item">
            <span className="seat seat-removing" aria-hidden="true" />
            To remove
          </span>
        </>
      )}
    </div>
  )
}

export default SeatLegend
