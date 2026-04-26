import { createEffect, createSignal, Show } from "solid-js"

import {
  UrlSource,
  Input,
  MP4, 
  AudioBufferSink, VideoSampleSink,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  Conversion,
  QUALITY_VERY_HIGH,
  CanvasSink,
} from 'mediabunny';

import {
  currentVideo,
  setVideoDuration, videoDuration,
  setVideoTime, videoTime,
  setPlaybackSpeed, videoPlaybackSpeed,
  setVideoLastLoaded, videoLastLoaded,
  setVideoHeight,
  currentSelectedWord,
  formatSeconds,

  setVideoClipEnd, videoClipEnd,
  setVideoClipStart, videoClipStart,
} from '../data/simple'


export default function VideoPlayer() {
  const [out, setOut] = createSignal('');
  const [startThumb, setStartThumb] = createSignal('');
  const [endThumb, setEndThumb] = createSignal('');

  const [clipProgress, setClipProgress] = createSignal(0);

  let videoDOMEl;

  let videoSource;
  let input;

  createEffect(() => {

    if (currentVideo() && currentVideo().videoUrl) {
      videoSource = new UrlSource(currentVideo().videoUrl, {
        requestInit: {
          method: 'GET',
          mode: 'cors',  // Explicitly allowing CORS
        },
      })

      input = new Input({
        formats: [MP4],
        source: videoSource,
      })

      setVideoClipStart(null)
      setVideoClipEnd(null)
      setStartThumb('')
      setEndThumb('')
      // setClipProgress(0)
    }

    return currentVideo().videoUrl
  })

  createEffect(() => {
    setOut('')
    setClipProgress(0)

    return videoClipStart()
  })
  createEffect(() => {
    setOut('')
    setClipProgress(0)

    return videoClipEnd()
  })

  async function trimVideo() {
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    })

    const conversion = await Conversion.init({
      input, output,
      trim: {
        start: videoClipStart(),
        end: videoClipEnd(),
      },
      video: {
        bitrate: QUALITY_VERY_HIGH,
      },
      audio: {
        bitrate: QUALITY_VERY_HIGH,
      },
    });
    conversion.onProgress = (progress) => (setClipProgress(progress))
    await conversion.execute();
    await output.finalize();

    const buffer = output.target.buffer
    if (!buffer) {
      throw new Error('No video data produced.')
    }

    const blob = new Blob([buffer], { type: output.format.mimeType })
    const url = URL.createObjectURL(blob)

    setOut(url);
  }

  async function getThumbnail(timestamp, callback) {
    const videoTrack = await input.getPrimaryVideoTrack()

    if (videoTrack) {
      const decodable = await videoTrack.canDecode()

      if (decodable) {
        const sink = new CanvasSink(videoTrack, {
          width: 100,
        })

        const result = await sink.getCanvas(timestamp);
        const canvasEl = result.canvas as HTMLCanvasElement
        await canvasEl.toBlob((blob) => {
          callback(URL.createObjectURL(blob))
        },'image/png')
      }
    }
  }
  const clipName = () => (`${currentVideo().slug}--clip--${new Date().toISOString().split('T')[0]}--${videoClipStart()}-${videoClipEnd()}.mp4`)

  const canSetClipStart = () => ((videoClipEnd() && videoClipEnd() > videoTime()) || videoTime() > 0)
  const canSetClipEnd = () => (videoClipStart() && videoTime() > videoClipStart())
  const canMakeClip = () => (videoClipEnd() !== null && videoClipStart() !== null && (videoClipEnd() - videoClipStart() > 1))

  async function startClip() {
    setVideoClipStart(videoTime())
    await getThumbnail(videoClipStart(), setStartThumb)
  }

  async function endClip() {
    setVideoClipEnd(videoTime())
    await getThumbnail(videoClipEnd(), setEndThumb)
  }

  createEffect(() => {
    if (videoClipEnd() === null) {
      return videoClipStart()
    }

    if (videoClipEnd() < videoClipStart()) {
      setVideoClipEnd(null)
    }
    return videoClipStart()
  })

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
      <Show when={videoDuration() > 0}>
        <p>Video clipping feature is in testing.</p>
        <div class="flex flex-wrap border-2 border-slate-300 rounded-lg divide-x-2 mb-4">
          <button classList={{
            'px-2': true,
            'hover:bg-sky-100': true,
            'focus:bg-sky-100': true,
            'opacity-25': !canSetClipStart(),
            'cursor-pointer': canSetClipStart(),
          }} onclick={startClip} disabled={!canSetClipStart()}
            >Mark Clip Start</button>
          <button classList={{
            'px-2': true,
            'hover:bg-sky-100': true,
            'focus:bg-sky-100': true,
            'opacity-25': !canSetClipEnd(),
            'cursor-pointer': canSetClipEnd(),
          }} onclick={endClip} disabled={!canSetClipEnd()}
            >Mark Clip End</button>
          <button classList={{
            'px-2': true,
            'hover:bg-sky-100': true,
            'focus:bg-sky-100': true,
            'opacity-25': !canMakeClip(),
            'cursor-pointer': canMakeClip(),
          }} onclick={trimVideo} disabled={!canMakeClip()}
          >Make Clip{canMakeClip() && ` (${formatSeconds(videoClipEnd() - videoClipStart())}s)` || ''}</button>
        </div>
      </Show>
      <div class="flex py-2 bg-slate-50">
        <Show when={videoClipStart() !== null}>
          <div>
            <Show when={startThumb() !== ''}>
              <img src={startThumb()} width='100px'/>
            </Show>
            <p>Start @ {formatSeconds(videoClipStart())}</p>
          </div>
        </Show>
        <Show when={videoClipEnd() !== null}>
          <div>
            <Show when={endThumb() !== ''}>
              <img src={endThumb()} width='100px'/>
            </Show>
            <p>End @ {formatSeconds(videoClipEnd())}</p>
          </div>
        </Show>
        <Show when={clipProgress() > 0}>
          <div class="w-full flex bg-slate-50">
            <div class="bg-sky-500" style={{width: `${clipProgress() * 100}%`, height: '20px'}}>
              Making clip...
            </div>
          </div>
        </Show>
      </div>
      <Show when={out() !== ''}>
        <div class="flex flex-col py-2">
          <p>Clip Preview: {formatSeconds(videoClipStart())} - {formatSeconds(videoClipEnd())}</p>
          <p>Clip Name: {clipName()}</p>
          <video
            src={out()}
            width={"100%"}
            height={"auto"}
            controls
            plays-inline/>
          <a class="border-2 border-slate-300 rounded-lg p-2 hover:bg-sky-100 focus:bg-sky-100 cursor-pointer" href={out()} download={clipName()}>Click to Download</a>
        </div>
      </Show>
    </>
  );
}
