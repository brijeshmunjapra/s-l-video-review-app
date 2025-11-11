import React from 'react'
import './index.scss'

function SideBar({ videoTypes, setSelectedVideoType, selectedVideoType }) {
  return (
    <div className="side-bar">
      <div className="side-bar-header">
        <h2>Video Types</h2>
      </div>
      <div className="side-bar-content">
        {videoTypes?.length > 0 ? (
          videoTypes.map((type) => (
            <div
              key={type.label}
              className={`side-bar-item ${selectedVideoType === type.value ? 'active' : ''}`}
              onClick={() => setSelectedVideoType(type.value)}
            >
              {type.label}
            </div>
          ))
        ) : (
          <div className="side-bar-empty">No video types available</div>
        )}
      </div>
    </div>
  )
}

export default SideBar