import { Component, Show, Suspense } from 'solid-js';

import TranscriptSearcher from '../../components/transcript-search'
import TranscriptViewer from '../../components/transcript-viewer'
import Playlist from '../../components/playlist'
import VideoPlayer from '../../components/video-player'
import PlayistSelector from '../../components/playlist-selector';

import {
  setVideos,
  videoHeight,
  currentVideo,
  getAllVideos,
} from '../../data/simple';

export default function Home() {
  getAllVideos(setVideos)

  let transcriptEl!: Component

  return (
    <div class="bg-gray-100 text-gray-700 p-8 h-[90vh]">
      <PlayistSelector/>
      <div class="flex items-center space-x-2 h-full">
        <div class="h-full w-1/3">
          <VideoPlayer/>
          <nav class="h-full overflow-y-auto border-2 border-slate-300 rounded-lg transition-[height]" style={videoHeight() && {height: `calc(100vh - ${videoHeight() + 60}px)`} || {}}>
            <Playlist/>
          </nav>
        </div>
        <div class="h-full w-2/3">
          <Suspense>
            <Show when={currentVideo().title}>
              <div class="flex justify-between">
                <h1 class="text-2xl pb-2">{currentVideo().title}</h1>
                <TranscriptSearcher transcriptViewer={() => transcriptEl}/>
              </div>
            </Show>
          </Suspense>
          <TranscriptViewer ref={transcriptEl}/>
        </div>
      </div>
    </div>
  );
}
