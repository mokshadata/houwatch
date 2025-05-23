import { createSignal, createResource, createEffect, For, Show, createMemo, Suspense } from 'solid-js';
import Mark from 'mark.js';

function formatSeconds(seconds) {
  // Calculate hours
  const hours = Math.floor(seconds / 3600);
  // Calculate remaining minutes
  const minutes = Math.floor((seconds % 3600) / 60);
  // Calculate remaining seconds
  const secs = Math.floor(seconds % 60);

  const percent = Math.floor((seconds % 1) * 100);

  // Format each unit to be two digits and join with ':'
  return `${[
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')}.${percent.toString().padStart(2, '0')}`;
}

const mapAirToJSON = (item) => ({
  "title": item["Title"],
  "tags": (item["Tags"] || []).map((tag) => (tag.value)),
  "collection": item["Collection"],
  "recordingDate": item['Recording Date'],
  "source": (item.Source || {}).value,
  "slug": item.Slug,
  "id": item.ID,
  "videoUrl": item['Video on AWS'],
  "clipName": item['File Name'],
  "sttEngine": (item['Transcription Engine'] || {}).value,
  "audioUrl": item['Audio'],

  "original": item["Video Source URL"],
  "swagit_id": item["SwagIt ID"],
  "agenda": item["Agenda"],
  "proposal": item["Proposal"],
  "presentation": item["Presentation"],
})

const indexItemsByPath = (path, transformItemFn, items) => (
  items.reduce((results, curr) => ({
    ...results,
    [curr[path]]: transformItemFn(curr),
  }), {})
)

const sortIndexedItems = (path, items) => (Object.values(items).sort((item) => (item[path])))

const sortVideos = sortIndexedItems.bind(this, 'recordingDate');
const indexVideos = indexItemsByPath.bind(this, 'ID', mapAirToJSON)
const concatVideos = (allIndexed, results) => ({...allIndexed, ...indexVideos(results)})

const getAllVideos = async (handleResults) => {
  let next = "https://api.baserow.io/api/database/rows/table/546812/?user_field_names=true&size=50"
  let accumulating = {
    next,
    indexed: {},
  }

  while (accumulating.next) {
    accumulating = await fetch(accumulating.next.replace('http://', 'https://'), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token 5NMJRmuC1OaOsoRmQJFY3K6LM407y0mq"
        },
      })
      .then((res) => (res.json()))
      .then((resultsJSON) => {
        return {
          next: resultsJSON.next,
          indexed: concatVideos(accumulating.indexed, resultsJSON.results),
        }
      })
    handleResults(accumulating.indexed)
  }

  return accumulating
}

async function getTranscript (video, { value, refreshing }) {
  if (!video.id) {
    return
  }
  return await fetch('https://councilwatch.s3.us-east-2.amazonaws.com/transcripts/' + video.id + '.json')
    .then((res) => res.json())
}

function whichChild(elem){
  var  i= 0;
  while((elem=elem.previousSibling)!=null) ++i;
  return i;
}

export default function Home() {
  const [videos, setVideos] = createSignal({})
  const [videoHeight, setVideoHeight] = createSignal(0)
  const [videoLastLoaded, setVideoLastLoaded] = createSignal(0)
  const [videoPlaybackSpeed, setPlaybackSpeed] = createSignal(1)

  const [selectedParagraphIndex, setSelectedParagraphIndex] = createSignal(0)
  const [selectedWordIndex, setSelectedWordIndex] = createSignal(0)

  const [activeMarkIndex, setActiveMarkIndex] = createSignal(0)
  const [totalMarks, setTotalMarks] = createSignal(0)
  const [searchText, setSearchText] = createSignal('')

  getAllVideos(setVideos)

  // let transcriptEl;
  let videoDOMEl;
  let markInstance;

  const sortedVideos = createMemo(() => sortVideos(videos()))
  const [currentVideo, setCurrentVideo] = createSignal({})
  const [videoTime, setVideoTime] = createSignal(0)
  const [videoDuration, setVideoDuration] = createSignal(0)

  const [currentTranscript, { mutate: mutateTranscript, refetch: refetchTranscript }] = createResource(currentVideo, getTranscript)

  const currentTranscriptByParagraphs = () => currentTranscript() && currentTranscript().transcript.paragraphs.map((para, paragraphIndex) => ({...para, paragraphIndex, words: currentTranscript().transcript.words.filter((word) => (word.start >= para.start && word.end <= para.end)) }))

  const currentSelectedWord = () => currentTranscriptByParagraphs() && currentTranscriptByParagraphs()[selectedParagraphIndex()].words[selectedWordIndex()] || {}

  const handleVideoSelect = (video, clickEvent) => {
    clickEvent.preventDefault()
    setCurrentVideo(video)
    setSelectedParagraphIndex(0)
    setSelectedWordIndex(0)

    setVideoTime(0)
    setVideoDuration(0)
    setPlaybackSpeed(1)
    setActiveMarkIndex(0)
    setTotalMarks(0)
  }

  const handleTranscriptClick = () => {
    const selObj = window.getSelection();
    const wordIndex = Math.floor((whichChild(selObj.anchorNode) + 1) / 2)

    setSelectedParagraphIndex(selObj.anchorNode.parentNode.dataset.paragraphIndex)
    setSelectedWordIndex(wordIndex)
  }

  createEffect(() => {
    videoDOMEl.currentTime = currentSelectedWord().start || 0
    videoDOMEl.play()
  })
    
  createEffect(() => {
    if (videoLastLoaded() > 0) {
      setVideoHeight(videoDOMEl.videoHeight)
    }
  })

  createEffect(() => {
    videoDOMEl.playbackRate = videoPlaybackSpeed()
  })

  createEffect(() => {
    console.log(searchText())
    markInstance?.unmark({
      done: function(){
        markInstance.mark(searchText(), {
          separateWordSearch: true,
          diacritics: true,
          exclude: ['[role="complementary"]'],
        });

        const marks = document.querySelectorAll('mark')

        setTotalMarks(marks.length)
        marks[activeMarkIndex()]?.scrollIntoView({ 
          behavior: 'smooth'
        })

        if (marks.length === 0) {
          document.querySelector('article').scrollTo(0, 0)
        }
      }
    });
  })

  createEffect(() => {
    document.querySelectorAll('mark')[activeMarkIndex()]?.scrollIntoView({ 
      behavior: 'smooth'
    })
  })

  return (
    <div class="bg-gray-100 text-gray-700 p-8 h-[90vh]">
      <div class="flex items-center space-x-2 h-full">
        <div class="h-full w-1/3">
          <video
            classList={{
              "hidden": !currentVideo().id
            }}
            src={currentVideo().videoUrl}
            width={"100%"}
            height={"auto"}
            controls
            plays-inline
            ref={(el) => {
              videoDOMEl = el
              videoDOMEl.addEventListener("loadeddata", (event) => {
                setVideoLastLoaded(event.timeStamp)
                setVideoDuration(videoDOMEl.duration)
              })
              videoDOMEl.addEventListener("timeupdate", (event) => {
                setVideoTime(videoDOMEl.currentTime)
              })
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
                    setPlaybackSpeed(changeEvent.target.value * 1)
                  }}
                >
                  {[0.5, 1, 1.5, 2, 3, 4].map((speed) => (
                    <option value={speed} selected={videoPlaybackSpeed() === (speed * 1)}>{speed}x</option>
                  ))}
                </select>
              </form>
            </div>
          </Show>
          <nav class="h-full overflow-y-auto border-2 border-slate-300 rounded-lg transition-[height]" style={videoHeight() && {height: `calc(100vh - ${videoHeight() + 10}px)`} || {}}>
            <ul class="w-full flex flex-col divide-y-2">
            <Suspense>
              <For each={sortedVideos()}>{(video) =>
                <li classList={{
                    "bg-sky-200 sticky top-0": currentVideo().id === video.id,
                    "w-full hover:bg-sky-100 focus:bg-sky-100": true,
                  }}>
                  <a class="p-2 w-full block" href={video.videoUrl} onClick={handleVideoSelect.bind(null, video)}>
                    {video.title}
                  </a>
                </li>
              }</For>
            </Suspense>
            </ul>
          </nav>
        </div>
        <div class="h-full w-2/3">
          <Suspense>
            <Show when={currentVideo().title}>              
              <div class="flex justify-between">
                <h1 class="text-2xl pb-2">{currentVideo().title}</h1>
                <div class="flex items-center">
                  <input class="
                    min-w-80
                    bg-gray-50 border
                    border-gray-300
                    text-gray-900
                    text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    type="search" placeholder="Search"
                    value={searchText()}
                    onInput={(changeEvent) => {
                      setSearchText(changeEvent.target.value)
                    }}
                  />
                  <div classList={{"font-mono text-xs inline-block text-nowrap px-2": true,
                    "text-gray-300": totalMarks() === 0,
                  }}>
                    {totalMarks() > 0 && (activeMarkIndex() + 1) || 0} / {totalMarks()}
                  </div>
                  <button data-search="next" classList={{"text-gray-300": activeMarkIndex() === (totalMarks() - 1) || (totalMarks() === 0)}} onClick={() => {
                    if (totalMarks() === 0) {
                      return
                    }
                    if (activeMarkIndex() === totalMarks() - 1) {
                      return
                    }
                    setActiveMarkIndex(activeMarkIndex() + 1)
                  }}>&darr;</button>
                  <button data-search="prev" classList={{"text-gray-300": activeMarkIndex() === 0 || (totalMarks() === 0)}} onClick={() => {
                    if (totalMarks() === 0) {
                      return
                    }
                    if (activeMarkIndex() === 0) {
                      return
                    }
                    setActiveMarkIndex(activeMarkIndex() - 1)
                  }}>&uarr;</button>
                  <button data-search="clear" onClick={() => {
                    setSearchText('')
                    setActiveMarkIndex(0)
                  }}>✖</button>
                </div>
              </div>
            </Show>
          </Suspense>
          <Suspense>
            <Show when={currentTranscriptByParagraphs()}>
              <article
                class="h-full overflow-y-auto p-4 relative divide-y-2 bg-white border-2 border-slate-300 rounded-lg"
                onDblClick={handleTranscriptClick}
                ref={(el) => {
                  markInstance = new Mark(el)
                }}
              >
                <For each={currentTranscriptByParagraphs()}>{
                  (para) => (
                    <section class="flex h-auto static p-2">
                      <div class="h-full sticky top-0 pr-2 w-1/6" role="complementary">
                        <p>
                          {para.speaker}
                        </p>
                        <p class="text-xs text-slate-500 font-mono">{formatSeconds(para.start)} - {formatSeconds(para.end)}</p>
                      </div>
                      <p class="h-full w-5/6" data-paragraph-index={para.paragraphIndex}>
                        {para.words.map((word) => (<>{word.text} </>))}
                      </p>
                    </section>
                  )
                }</For>
              </article>
            </Show>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
