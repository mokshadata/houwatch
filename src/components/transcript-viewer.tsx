import { Suspense, Show, For, } from "solid-js"

import {
  currentTranscriptByParagraphs, setCurrentSelectedWord,
  formatSeconds,
} from "../data/simple"


export default function TranscriptViewer(props) {

  return (
    <Suspense>
      <Show when={currentTranscriptByParagraphs()}>
        <article
          class="h-full overflow-y-auto p-4 relative divide-y-2 bg-white border-2 border-slate-300 rounded-lg"
          // onDblClick={handleTranscriptClick}
          ref={props.ref}
        >
          <For each={currentTranscriptByParagraphs()}>
            {(para) => (
              <section class="flex h-auto static p-2">
                <div
                  class="h-full sticky top-0 pr-2 w-1/6"
                  role="complementary"
                >
                  <p>{para.speaker}</p>
                  <p class="text-xs text-slate-500 font-mono">
                    {formatSeconds(para.start)} - {formatSeconds(para.end)}
                  </p>
                </div>
                <p
                  class="h-full w-5/6 cursor-pointer"
                  data-paragraph-index={para.paragraphIndex}
                >
                  {para.words.map((word) => (
                    <span
                      class="hover:bg-sky-100 inline-block px-0.5"
                      onDblClick={() => {
                        // setSelectedWordIndex()
                        setCurrentSelectedWord(word);
                      }}
                    >{`${word.text}`}</span>
                  ))}
                </p>
              </section>
            )}
          </For>
        </article>
      </Show>
    </Suspense>
  );
}
