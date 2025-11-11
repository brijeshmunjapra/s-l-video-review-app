import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook to generate thumbnails for videos
 * @param {Array} videoGroups - Array of video groups with videos array
 * @returns {Array} - Array of video groups with thumbnails added to each video
 */
export function useVideoThumbnails(videoGroups) {
  const [videosWithThumbnails, setVideosWithThumbnails] = useState(null)
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    if (!videoGroups || videoGroups.length === 0) {
      setVideosWithThumbnails(null)
      return
    }

    // Abort previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    
    // Create a single canvas for all thumbnails
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    const signal = abortControllerRef.current.signal

    // Flatten all videos with initial state
    const allVideos = videoGroups.flatMap(group => 
      group.videos?.map(video => ({
        ...video,
        video_type_display: group.video_type_display,
        video_type: group.video_type,
        thumbnail: null,
        thumbnailLoading: true,
        thumbnailError: false
      })) || []
    )

    const processVideo = (video) => {
      return new Promise((resolve) => {
        if (signal.aborted) {
          resolve({
            ...video,
            thumbnail: null,
            thumbnailLoading: false,
            thumbnailError: true
          })
          return
        }

        const videoElement = document.createElement('video')
        videoElement.src = video.video_stream_url
        videoElement.muted = true
        videoElement.preload = 'metadata'
        videoElement.crossOrigin = 'anonymous'
        videoElement.style.position = 'absolute'
        videoElement.style.width = '1px'
        videoElement.style.height = '1px'
        videoElement.style.opacity = '0'
        videoElement.style.pointerEvents = 'none'
        document.body.appendChild(videoElement)

        const timeoutId = setTimeout(() => {
          if (!signal.aborted) {
            videoElement.remove()
            resolve({
              ...video,
              thumbnail: null,
              thumbnailLoading: false,
              thumbnailError: true
            })
          }
        }, 5000)

        const generateThumbnail = () => {
          if (signal.aborted) {
            clearTimeout(timeoutId)
            videoElement.remove()
            return
          }
          try {
            if (videoElement.readyState >= 2) {
              videoElement.currentTime = 1
            }
          } catch (e) {
            setTimeout(() => captureFrame(), 100)
          }
        }

        const captureFrame = () => {
          if (signal.aborted) {
            clearTimeout(timeoutId)
            videoElement.remove()
            return
          }
          try {
            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
              const ctx = canvas.getContext('2d')
              canvas.width = videoElement.videoWidth
              canvas.height = videoElement.videoHeight
              
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
              
              clearTimeout(timeoutId)
              videoElement.remove()
              
              if (!signal.aborted) {
                resolve({
                  ...video,
                  thumbnail: thumbnailUrl,
                  thumbnailLoading: false,
                  thumbnailError: false
                })
              }
            } else {
              setTimeout(() => {
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                  captureFrame()
                } else {
                  clearTimeout(timeoutId)
                  videoElement.remove()
                  if (!signal.aborted) {
                    resolve({
                      ...video,
                      thumbnail: null,
                      thumbnailLoading: false,
                      thumbnailError: true
                    })
                  }
                }
              }, 500)
            }
          } catch (e) {
            console.error('Error capturing thumbnail for video:', video.id, e)
            clearTimeout(timeoutId)
            videoElement.remove()
            if (!signal.aborted) {
              resolve({
                ...video,
                thumbnail: null,
                thumbnailLoading: false,
                thumbnailError: true
              })
            }
          }
        }

        const handleError = () => {
          clearTimeout(timeoutId)
          videoElement.remove()
          if (!signal.aborted) {
            resolve({
              ...video,
              thumbnail: null,
              thumbnailLoading: false,
              thumbnailError: true
            })
          }
        }

        videoElement.addEventListener('loadeddata', generateThumbnail)
        videoElement.addEventListener('seeked', captureFrame)
        videoElement.addEventListener('loadedmetadata', generateThumbnail)
        videoElement.addEventListener('error', handleError)
        videoElement.addEventListener('stalled', () => {
          setTimeout(() => {
            if (videoElement.readyState < 2 && !signal.aborted) {
              handleError()
            }
          }, 2000)
        })
      })
    }

    // Process all videos in batches to avoid overwhelming the browser
    const processBatch = async (videos, batchSize = 3) => {
      const results = []
      for (let i = 0; i < videos.length; i += batchSize) {
        if (signal.aborted) break
        const batch = videos.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(processVideo))
        results.push(...batchResults)
      }
      return results
    }

    processBatch(allVideos)
      .then((processedVideos) => {
        if (signal.aborted) return

        // Reconstruct the groups structure with thumbnails
        const groupsWithThumbnails = videoGroups.map(group => ({
          ...group,
          videos: group.videos?.map(video => {
            const processed = processedVideos.find(p => p.id === video.id)
            return processed || {
              ...video,
              thumbnail: null,
              thumbnailLoading: false,
              thumbnailError: true
            }
          }) || []
        }))

        setVideosWithThumbnails(groupsWithThumbnails)
        setLoading(false)
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Error processing thumbnails:', error)
          setVideosWithThumbnails(videoGroups)
          setLoading(false)
        }
      })

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [videoGroups])

  return { videosWithThumbnails, loading }
}

