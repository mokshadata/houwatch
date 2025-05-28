import { createSignal, createMemo, createResource, createEffect} from "solid-js";

export function formatSeconds(seconds) {
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
  "collections": (item["Collection"] || []).map((item) => item.value),
  "recordingDate": item['Recording Date'],
  "sources": (item["Organization"] || []).map((item) => item.value),
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

const sortVideos = sortIndexedItems.bind(this, 'recordingDate')
const indexVideos = indexItemsByPath.bind(this, 'ID', mapAirToJSON)
const concatVideos = (allIndexed, results) => ({...allIndexed, ...indexVideos(results)})

export const getAllVideos = async (handleResults) => {
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
        mode: 'cors',
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

export async function getTranscript (video, { value, refreshing }) {
  if (!video.id) {
    return
  }
  return await fetch('https://councilwatch.s3.us-east-2.amazonaws.com/transcripts/' + video.id + '.json', {
      mode: 'cors',
    })
    .then((res) => res.json())
}

export function whichChild(elem){
  var  i= 0;
  while((elem=elem.previousSibling)!=null) ++i;
  return i;
}

export const [videos, setVideos] = createSignal({})
export const [videoHeight, setVideoHeight] = createSignal(0)
export const [videoLastLoaded, setVideoLastLoaded] = createSignal(0)
export const [videoPlaybackSpeed, setPlaybackSpeed] = createSignal(1)

export const [selectedParagraphIndex, setSelectedParagraphIndex] = createSignal(0)
export const [selectedWordIndex, setSelectedWordIndex] = createSignal(0)

export const [activeMarkIndex, setActiveMarkIndex] = createSignal(0)
export const [totalMarks, setTotalMarks] = createSignal(0)
export const [searchText, setSearchText] = createSignal('')

export const sortedVideos = createMemo(() => sortVideos(videos()))

export const groupedVideos = createMemo(() => {
  return Object.entries(sortedVideos().reduce((acc, curr) => ({...acc, ...Object.fromEntries(curr.collections.map((playlist) => [playlist, [...(acc[playlist] || []), curr]]))}), {}))
    .map(([playlist, videos]) => ({ playlist, videos }))
})

export const [activePlaylist, setActivePlaylist] = createSignal('City Council 2025')

export const playlist = () => (groupedVideos().find((lists) => (lists.playlist === activePlaylist()))?.videos || [])

export const [currentVideo, setCurrentVideo] = createSignal({})
export const [videoTime, setVideoTime] = createSignal(0)
export const [videoDuration, setVideoDuration] = createSignal(0)

export const [currentTranscript, { mutate: mutateTranscript, refetch: refetchTranscript }] = createResource(currentVideo, getTranscript)

export const currentTranscriptByParagraphs = () => currentTranscript() && currentTranscript().transcript.paragraphs.map((para, paragraphIndex) => ({...para, paragraphIndex, words: currentTranscript().transcript.words.filter((word) => (word.start >= para.start && word.end <= para.end)) }))
// export const currentSelectedWord = () => currentTranscriptByParagraphs() && currentTranscriptByParagraphs()[selectedParagraphIndex()]?.words[selectedWordIndex()] || {}
export const [currentSelectedWord, setCurrentSelectedWord] = createSignal({})

export function resetVideoDetails() {
  setVideoTime(0)
  setVideoDuration(0)
  setPlaybackSpeed(1)

  setSearchText('')
  setActiveMarkIndex(0)
  setTotalMarks(0)
}