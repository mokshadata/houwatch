import { createEffect, Show } from "solid-js"

import {
  currentVideo,
  setVideoDuration, videoDuration,
  setVideoTime, videoTime,
  setPlaybackSpeed, videoPlaybackSpeed,
  setVideoLastLoaded, videoLastLoaded,
  setVideoHeight,
  currentSelectedWord,
  formatSeconds
} from '../data/simple'


export default function VideoPlayer() {
  let videoDOMEl;

  createEffect(() => {
    videoDOMEl.currentTime = currentSelectedWord().start || 0
    videoDOMEl.play()

    return currentSelectedWord()
  })
    
  createEffect(() => {
    if (videoLastLoaded() > 0) {
      setVideoHeight(videoDOMEl.videoHeight)
    }
    return videoLastLoaded()
  })

  createEffect(() => {
    videoDOMEl.playbackRate = videoPlaybackSpeed()
    return videoPlaybackSpeed()
  })

  return (
    <>
      <video
        classList={{
          hidden: !currentVideo().id,
        }}
        src={currentVideo().videoUrl}
        width={"100%"}
        height={"auto"}
        controls
        plays-inline
        ref={(el) => {
          videoDOMEl = el;
          videoDOMEl.addEventListener("loadeddata", (event) => {
            setVideoLastLoaded(event.timeStamp);
            setVideoDuration(videoDOMEl.duration);
          });
          videoDOMEl.addEventListener("timeupdate", (event) => {
            setVideoTime(videoDOMEl.currentTime);
          });
        }}
      ></video>
      <Show when={currentVideo().id}>
        <div class="w-full flex justify-between align-middle">
          <p class="text-xs font-mono content-center">
            {formatSeconds(videoTime())} | {formatSeconds(videoDuration())}
          </p>
          <form>
            <select
              class="
                  bg-gray-50 border
                  border-gray-300
                  text-gray-900
                  text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
              onChange={(changeEvent) => {
                setPlaybackSpeed(changeEvent.target.value * 1);
              }}
            >
              {[0.5, 1, 1.5, 2, 3, 4].map((speed) => (
                <option
                  value={speed}
                  selected={videoPlaybackSpeed() === speed * 1}
                >
                  {speed}x
                </option>
              ))}
            </select>
          </form>
        </div>
      </Show>
    </>
  );
}
