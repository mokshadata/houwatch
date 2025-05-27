import { Show, Suspense } from 'solid-js';

import TranscriptSearcher from '../../components/transcript-search'
import TranscriptViewer from '../../components/transcript-viewer'
import Playlist from '../../components/playlist'
import VideoPlayer from '../../components/video-player'

import {
  setVideos,
  videoHeight,
  currentVideo,
  getAllVideos,
} from '../../data/simple';

export default function Home() {
  // const [selectedParagraphIndex, setSelectedParagraphIndex] = createSignal(0)
  // const [selectedWordIndex, setSelectedWordIndex] = createSignal(0)

  getAllVideos(setVideos)

  // let transcriptEl;

  // const handleTranscriptClick = () => {
  //   const selObj = window.getSelection()
  //   const wordIndex = Math.floor((whichChild(selObj.anchorNode) + 1) / 2)
  //   console.log(selObj, wordIndex, 'transcript click')

  //   setSelectedParagraphIndex(selObj.anchorNode.parentNode.dataset.paragraphIndex)
  //   setSelectedWordIndex(wordIndex)
  // }

  // createEffect(() => {
  //   // console.log(selectedParagraphIndex(), selectedWordIndex(), currentSelectedWord())
  // })

  return (
    <div class="bg-gray-100 text-gray-700 p-8 h-[90vh]">
      <div class="flex items-center space-x-2 h-full">
        <div class="h-full w-1/3">
          <VideoPlayer/>
          <nav class="h-full overflow-y-auto border-2 border-slate-300 rounded-lg transition-[height]" style={videoHeight() && {height: `calc(100vh - ${videoHeight() + 20}px)`} || {}}>
            <Playlist/>
          </nav>
        </div>
        <div class="h-full w-2/3">
          <Suspense>
            <Show when={currentVideo().title}>
              <div class="flex justify-between">
                <h1 class="text-2xl pb-2">{currentVideo().title}</h1>
                <TranscriptSearcher/>
              </div>
            </Show>
          </Suspense>
          <TranscriptViewer/>
        </div>
      </div>
    </div>
  );
}
