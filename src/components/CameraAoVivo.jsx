function CameraAoVivo() {
  return (
    <div className="painel camera-ao-vivo">
      <h2>Câmera ao Vivo</h2>
      <div className="camera-video-container">
        <img
          src="http://localhost:8000/stream/live"
          alt="Câmera ao vivo com detecção de IA"
          className="camera-video"
        />
      </div>
    </div>
  )
}

export default CameraAoVivo
