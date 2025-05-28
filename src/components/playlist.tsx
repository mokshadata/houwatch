import { Suspense, For } from "solid-js"

import {
  setCurrentVideo, currentVideo,
  resetVideoDetails, sortedVideos,
  playlist,
} from "../data/simple";

export default function Playlist() {
  const handleVideoSelect = (video, clickEvent) => {
    clickEvent.preventDefault();
    setCurrentVideo(video);
    // setSelectedParagraphIndex(0)
    // setSelectedWordIndex(0)
    resetVideoDetails();
  };

  return (
    <ul class="w-full flex flex-col divide-y-2">
      <Suspense>
        <For each={playlist()}>
          {(video) => (
            <li
              classList={{
                "bg-sky-200 sticky top-0": currentVideo().id === video.id,
                "w-full hover:bg-sky-100 focus:bg-sky-100": true,
              }}
            >
              <a
                class="p-2 w-full block"
                href={video.videoUrl}
                onClick={handleVideoSelect.bind(null, video)}
              >
                {video.title}
              </a>
            </li>
          )}
        </For>
      </Suspense>
    </ul>
  );
}
