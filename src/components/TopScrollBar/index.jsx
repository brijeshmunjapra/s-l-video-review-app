import React from 'react'
import './index.scss'

function VideoThumbnail({ video, onSelect, isSelected }) {
  // Use thumbnail from video object if available
  const thumbnail = null
  const loading = false

  return (
    <div 
      className={`video-thumbnail ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(video)}
      title={video.title}
    >
      <div className="thumbnail-container">
        {loading && <div className="thumbnail-loading">Loading...</div>}
        {!thumbnail && (
          <div className="thumbnail-placeholder">
            <span className="placeholder-icon">📹</span>
            <span className="placeholder-text">{video.title || 'Video'}</span>
          </div>
        )}
        {thumbnail ? (
          <img src={thumbnail} alt={video.title} className="thumbnail-image" />
        ) : loading ? (
          <div className="thumbnail-loading">Loading...</div>
        ) : null}
      </div>
    </div>
  )
}

  function TopScrollBar({ videos, selectedVideo, setSelectedVideo }) {
  // Flatten all videos from all groups
  const allVideos = videos?.flatMap(group => 
    group.videos?.map(video => ({
      ...video,
      video_type_display: group.video_type_display,
      video_type: group.video_type
    })) || []
  ) || []

  const handleVideoSelect = (video) => {
    setSelectedVideo(video)
  }

  return (
    <div className="top-scroll-bar">
      <div className="top-scroll-bar-content">
        {allVideos.length > 0 ? (
          allVideos.map((video) => (
            <VideoThumbnail
              key={video.id}
              video={video}
              onSelect={handleVideoSelect}
              isSelected={selectedVideo?.id === video.id}
            />
          ))
        ) : (
          <div className="no-videos">Select a video type to see the videos</div>
        )}
      </div>
    </div>
  );
}

export default TopScrollBar;