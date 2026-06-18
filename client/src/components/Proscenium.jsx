function Proscenium() {
  return (
    <div className="proscenium" aria-hidden="true">
      <div className="proscenium-frame">
        <div className="proscenium-curtain" />
        <div className="proscenium-arch" />
        <div className="proscenium-curtain" />
      </div>
      <div className="proscenium-apron">
        <div className="proscenium-footlights" />
        <div className="proscenium-stage-label">
          <div className="proscenium-line" />
          <span className="proscenium-label">Stage</span>
          <div className="proscenium-line" />
        </div>
      </div>
    </div>
  )
}

export default Proscenium
