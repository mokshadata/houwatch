import { Suspense, Show, For, createEffect } from "solid-js"
import Mark from "mark.js"

import {
  searchText, setTotalMarks, activeMarkIndex,
  currentTranscriptByParagraphs, setCurrentSelectedWord,
  formatSeconds,
  totalMarks,
} from "../data/simple"


export default function TranscriptViewer() {
  let markInstance

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
          document.querySelector('article')?.scrollTo(0, 0)
        }
      }
    });
  })

  createEffect(() => {
    if ( activeMarkIndex() >= totalMarks() ) {
      return
    }
    document.querySelectorAll('mark')[activeMarkIndex()]?.scrollIntoView({ 
      behavior: 'smooth'
    })
  })


  return (
    <Suspense>
      <Show when={currentTranscriptByParagraphs()}>
        <article
          class="h-full overflow-y-auto p-4 relative divide-y-2 bg-white border-2 border-slate-300 rounded-lg"
          // onDblClick={handleTranscriptClick}
          ref={(el) => {
            markInstance = new Mark(el);
          }}
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
                  class="h-full w-5/6"
                  data-paragraph-index={para.paragraphIndex}
                >
                  {para.words.map((word) => (
                    <span
                      onDblClick={() => {
                        // setSelectedWordIndex()
                        setCurrentSelectedWord(word);
                      }}
                    >
                      {word.text}{" "}
                    </span>
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
