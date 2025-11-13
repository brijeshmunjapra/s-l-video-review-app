import { useState, useRef, useEffect } from "react";
import "./index.scss";
import { addComments, getComments, addLike, getLikes } from "../../services";

function VideoPlayArea({ videoUrl, videoId }) {
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [hoveredComment, setHoveredComment] = useState(null);
  const [hoveredLike, setHoveredLike] = useState(null);
  const [videoContainerWidth, setVideoContainerWidth] = useState(0);
  const [videoBounds, setVideoBounds] = useState({ left: 0, width: 0 });
  const [showCurrentTimeIndicator, setShowCurrentTimeIndicator] =
    useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const handleAddComment = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      // Capture the current time rounded to seconds
      const currentTime = Math.floor(videoRef.current.currentTime);
      setCurrentTime(currentTime);
      setShowCommentModal(true);
    }
  };

  const handleAddLike = async () => {
    if (videoRef.current && videoId && !isLiking) {
      const currentTime = Math.floor(videoRef.current.currentTime);
      const likeTime = formatTime(currentTime);

      // Check if like already exists at this time
      const existingLike = likes.find((like) => like.like_time === likeTime);
      if (existingLike) {
        return; // Already liked at this time
      }

      setIsLiking(true);
      try {
        const likeData = {
          like_time: likeTime,
        };
        const response = await addLike(likeData, videoId);

        // Add the new like to the list
        const newLike = response.like || {
          id: Date.now(),
          like_time: likeTime,
        };

        setLikes(
          [...likes, newLike].sort((a, b) => {
            const timeA = timeStringToSeconds(a.like_time);
            const timeB = timeStringToSeconds(b.like_time);
            return timeA - timeB;
          })
        );
      } catch (error) {
        console.error("Error adding like:", error);
      } finally {
        setIsLiking(false);
      }
    }
  };

  const handleSubmitComment = async () => {
    if (newComment.trim() && videoId) {
      const commentTime = formatTime(currentTime);
      const commentData = [
        {
          comment: newComment,
          comment_time: commentTime,
        },
      ];

      try {
        const response = await addComments(commentData, videoId);

        // Add the new comment to the list
        const newCommentObj = response.comment || {
          id: Date.now(),
          comment: newComment,
          comment_time: commentTime,
        };

        setComments(
          [...comments, newCommentObj].sort((a, b) => {
            const timeA = timeStringToSeconds(a.comment_time);
            const timeB = timeStringToSeconds(b.comment_time);
            return timeA - timeB;
          })
        );
        setNewComment("");
        setShowCommentModal(false);
      } catch (error) {
        console.error("Error adding comment:", error);
        // Optionally show an error message to the user
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeStringToSeconds = (timeString) => {
    // Convert HH:MM:SS to seconds
    const parts = timeString.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const handleCommentClick = (commentTime) => {
    if (videoRef.current) {
      const seconds = timeStringToSeconds(commentTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const handleLikeClick = (likeTime) => {
    if (videoRef.current) {
      const seconds = timeStringToSeconds(likeTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // Capture time rounded to seconds
      const currentTime = Math.floor(videoRef.current.currentTime);
      setCurrentTime(currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      // Update video bounds when video loads
      setTimeout(() => {
        updateVideoBounds();
      }, 100);
    }
  };

  const handleTimelineDotClick = (commentTime) => {
    if (videoRef.current) {
      const seconds = timeStringToSeconds(commentTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const handleTimelineDotTouch = (e, commentTime) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const seconds = timeStringToSeconds(commentTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const getExactTimeFromClick = (e) => {
    if (
      !videoRef.current ||
      !containerRef.current ||
      videoDuration === 0 ||
      videoBounds.width === 0
    )
      return 0;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;

    // Account for the 1rem left margin of the timeline overlay
    const timelineLeft = 16; // 1rem = 16px
    const timelineWidth = containerRect.width - 16 * 2; // Subtract both left and right margins

    // Calculate position relative to the timeline overlay area
    const relativeX = clickX - timelineLeft;
    const percentage = Math.max(0, Math.min(1, relativeX / timelineWidth));
    const exactTime = Math.floor(percentage * videoDuration);

    // Return time in seconds
    return Math.max(0, Math.min(videoDuration, exactTime));
  };

  const handleDotMouseEnter = (comment) => {
    setHoveredComment(comment);
  };

  const handleDotMouseLeave = () => {
    setHoveredComment(null);
  };

  const handleLikeDotMouseEnter = (like) => {
    setHoveredLike(like);
  };

  const handleLikeDotMouseLeave = () => {
    setHoveredLike(null);
  };

  const handleLikeDotClick = (likeTime) => {
    if (videoRef.current) {
      const seconds = timeStringToSeconds(likeTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const handleLikeDotTouch = (e, likeTime) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const seconds = timeStringToSeconds(likeTime);
      videoRef.current.currentTime = seconds;
    }
  };

  const handleTimelineClick = (e) => {
    if (videoRef.current && videoDuration > 0) {
      const exactTime = getExactTimeFromClick(e);
      videoRef.current.currentTime = exactTime;
      setCurrentTime(exactTime);
    }
  };

  const handleTimelineMouseMove = (e) => {
    if (videoDuration > 0) {
      setShowCurrentTimeIndicator(true);
      const exactTime = getExactTimeFromClick(e);
      setCurrentTime(exactTime);
    }
  };

  const handleTimelineMouseLeave = () => {
    setShowCurrentTimeIndicator(false);
  };

  const calculateTimelinePosition = (commentTime) => {
    if (!videoRef.current || videoDuration === 0) return 0;

    // Convert comment_time string to seconds
    const timestamp =
      typeof commentTime === "string"
        ? timeStringToSeconds(commentTime)
        : commentTime;

    // Ensure we have a valid timestamp
    const validTimestamp = Math.max(0, Math.min(timestamp, videoDuration));

    // Calculate percentage position relative to timeline overlay width
    const percentage = (validTimestamp / videoDuration) * 100;

    // Return percentage rounded to 2 decimal places
    return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
  };

  const updateVideoContainerWidth = () => {
    if (containerRef.current) {
      setVideoContainerWidth(containerRef.current.offsetWidth);
    }
  };

  const updateVideoBounds = () => {
    if (videoRef.current && containerRef.current) {
      const video = videoRef.current;
      const container = containerRef.current;

      const containerRect = container.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      // Calculate video position relative to container
      const videoLeft = videoRect.left - containerRect.left;
      const videoWidth = videoRect.width;

      setVideoBounds({ left: videoLeft, width: videoWidth });

      // Debug logging
      console.log("Video bounds updated:", {
        containerWidth: containerRect.width,
        videoLeft: videoLeft,
        videoWidth: videoWidth,
        videoLeftPercent: (videoLeft / containerRect.width) * 100,
        videoWidthPercent: (videoWidth / containerRect.width) * 100,
      });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Prevent fullscreen on mobile devices
      video.addEventListener("webkitfullscreenchange", () => {
        if (document.webkitFullscreenElement) {
          document.webkitExitFullscreen();
        }
      });

      video.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      });

      // Prevent context menu on long press
      video.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
    }
  }, []);

  // Fetch comments and likes when videoId changes
  useEffect(() => {
    if (videoId) {
      // Fetch comments
      getComments(videoId)
        .then((fetchedComments) => {
          // Sort comments by time (convert to seconds for sorting)
          const sortedComments = fetchedComments.sort((a, b) => {
            const timeA = timeStringToSeconds(a.comment_time);
            const timeB = timeStringToSeconds(b.comment_time);
            return timeA - timeB;
          });
          setComments(sortedComments);
        })
        .catch((error) => {
          console.error("Error fetching comments:", error);
          setComments([]);
        });

      // Fetch likes
      getLikes(videoId)
        .then((fetchedLikes) => {
          //   {
          //     "id": 10,
          //     "video_id": 22,
          //     "like_time": "00:01:02",
          //     "created_at": "2025-11-12T10:12:00Z",
          //     "updated_at": "2025-11-12T10:12:00Z"
          // }
          // Sort likes by time (convert to seconds for sorting)
          const sortedLikes = fetchedLikes.sort((a, b) => {
            const timeA = timeStringToSeconds(a.like_time);
            const timeB = timeStringToSeconds(b.like_time);
            return timeA - timeB;
          });
          setLikes(sortedLikes);
        })
        .catch((error) => {
          console.error("Error fetching likes:", error);
          setLikes([]);
        });
    } else {
      setComments([]);
      setLikes([]);
    }
  }, [videoId]);

  useEffect(() => {
    // Update container width and video bounds on mount and resize
    updateVideoContainerWidth();
    updateVideoBounds();

    const handleResize = () => {
      updateVideoContainerWidth();
      updateVideoBounds();
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver for more accurate container size changes
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateVideoContainerWidth();
        updateVideoBounds();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div className="video-play-area">
      <div className="video-play-area-main-content">
        <div className="video-section">
          <div className="video-container" ref={containerRef}>
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="video-player"
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                x5-video-player-type="h5"
                x5-video-player-fullscreen="false"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📹</div>
                  <div className="placeholder-text">No video selected</div>
                  <div className="placeholder-subtext">
                    Select a video from the list above
                  </div>
                </div>
              </div>
            )}
            {videoDuration > 0 && videoBounds.width > 0 && (
              <div
                className="timeline-overlay"
                key={`timeline-${videoContainerWidth}-${videoBounds.left}-${videoBounds.width}`}
                onClick={handleTimelineClick}
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={handleTimelineMouseLeave}
              >
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="timeline-dot"
                    style={{
                      left: `${calculateTimelinePosition(
                        comment.comment_time
                      )}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimelineDotClick(comment.comment_time);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleTimelineDotTouch(e, comment.comment_time);
                    }}
                    onMouseEnter={() => handleDotMouseEnter(comment)}
                    onMouseLeave={handleDotMouseLeave}
                    title={`Comment at ${comment.comment_time}`}
                  />
                ))}
                {likes.map((like) => (
                  <div
                    key={like.id}
                    className="timeline-dot timeline-like-dot"
                    style={{
                      left: `${calculateTimelinePosition(like.like_time)}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeDotClick(like.like_time);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleLikeDotTouch(e, like.like_time);
                    }}
                    onMouseEnter={() => handleLikeDotMouseEnter(like)}
                    onMouseLeave={handleLikeDotMouseLeave}
                    title={`Like at ${like.like_time}`}
                  />
                ))}
                {showCurrentTimeIndicator && (
                  <div
                    className="current-time-indicator"
                    style={{
                      left: `${calculateTimelinePosition(currentTime)}%`,
                    }}
                  >
                    <div className="indicator-line"></div>
                    <div className="indicator-time">
                      {formatTime(currentTime)}
                    </div>
                  </div>
                )}
                {hoveredComment && (
                  <div
                    className="comment-tooltip"
                    style={{
                      left: `${calculateTimelinePosition(
                        hoveredComment.comment_time
                      )}%`,
                    }}
                  >
                    <div className="tooltip-time">
                      {hoveredComment.comment_time}
                    </div>
                    <div className="tooltip-text">{hoveredComment.comment}</div>
                  </div>
                )}
                {hoveredLike && (
                  <div
                    className="comment-tooltip like-tooltip"
                    style={{
                      left: `${calculateTimelinePosition(
                        hoveredLike.like_time
                      )}%`,
                    }}
                  >
                    <div className="tooltip-time">{hoveredLike.like_time}</div>
                    <div className="tooltip-text">❤️ Liked</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="interactions-section">
          <div className="comments-section">
            <div className="section-header">
              <button
                className="comment-btn"
                onClick={handleAddComment}
                disabled={!videoUrl || currentTime === 0}
                title={
                  !videoUrl
                    ? "No video selected"
                    : currentTime === 0
                    ? "Video must be playing to add a comment"
                    : "Add comment at current time"
                }
              >
                Add Comment
              </button>
              {comments.length > 0 && <h3>Comments ({comments.length})</h3>}
            </div>
            <div className="comments-list">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="comment-item"
                  onClick={() => handleCommentClick(comment.comment_time)}
                >
                  <div className="comment-time">{comment.comment_time}</div>
                  <div className="comment-text">{comment.comment}</div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="no-comments">
                  No comments yet. Click "Add Comment" to add your first
                  comment!
                </p>
              )}
            </div>
          </div>

          <div className="likes-section">
            <div className="section-header">
              <button
                className="like-btn"
                onClick={handleAddLike}
                disabled={!videoUrl || currentTime === 0 || isLiking}
                title={
                  !videoUrl
                    ? "No video selected"
                    : currentTime === 0
                    ? "Video must be playing to add a like"
                    : isLiking
                    ? "Adding like..."
                    : "Add like at current time"
                }
              >
                {isLiking ? "..." : "+ Add Like"}
              </button>
              {likes.length > 0 && (
                <h3 className="likes-title">Likes ({likes.length})</h3>
              )}
            </div>
            <div className="likes-list">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="like-item"
                  onClick={() => handleLikeClick(like.like_time)}
                >
                  <div className="like-time">{like.like_time}</div>
                </div>
              ))}
              {likes.length === 0 && (
                <p className="no-likes">
                  No likes yet. Click "❤️ Like" to add your first like!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCommentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Comment at {formatTime(currentTime)}</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              className="comment-textarea"
              autoFocus
            />
            <div className="modal-buttons">
              <button
                onClick={() => setShowCommentModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                className="submit-btn"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayArea;
