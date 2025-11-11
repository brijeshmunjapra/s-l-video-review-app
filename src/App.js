import "./App.css";
import { useEffect, useState } from "react";
import { getVideosByOrderId, getVideoTypes } from "./services";
import { useVideoThumbnails } from "./hooks/useVideoThumbnails";
import SideBar from "./components/SideBar";
import TopScrollBar from "./components/TopScrollBar";
import VideoPlayArea from "./components/VideoPlayArea";
import { videosResponse } from "./mock/videosResponse";

function App() {
  const [videoTypes, setVideoTypes] = useState(null);
  const [videos, setVideos] = useState(null);
  const [selectedVideoType, setSelectedVideoType] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Generate thumbnails when videos are fetched
  const { videosWithThumbnails } = useVideoThumbnails(videosResponse.groups);

  useEffect(() => {
    Promise.all([getVideoTypes(), getVideosByOrderId(84)])
      .then(([types, { groups }]) => {
        console.log(types, groups);
        setVideoTypes(types);
        setVideos(videosResponse.groups);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div className="app">
      <SideBar
        videoTypes={videoTypes}
        setSelectedVideoType={setSelectedVideoType}
        selectedVideoType={selectedVideoType}
      />
      <div className="main-content-container">
        <TopScrollBar
          videos={(videosWithThumbnails || videos)?.filter(video => video.video_type === selectedVideoType) || []}
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
        />
      <VideoPlayArea videoUrl={selectedVideo?.video_stream_url} videoId={selectedVideo?.id} />
    </div>
  </div>
)
}

export default App
