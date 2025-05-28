import { createEffect } from 'solid-js';

import Mark from 'mark.js'

import {
  activeMarkIndex, setActiveMarkIndex,
  totalMarks, setTotalMarks,
  searchText, setSearchText,
  currentTranscriptByParagraphs,
} from '../data/simple';

export default function TranscriptSearcher(props) {
  let markInstance

  createEffect(() => {
    markInstance = new Mark(props.transcriptViewer())
    return currentTranscriptByParagraphs()
  }, null)

  createEffect(() => {
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
    })

    return searchText()
  })

  createEffect(() => {
    if ( activeMarkIndex() >= totalMarks() ) {
      return
    }
    document.querySelectorAll('mark')[activeMarkIndex()]?.scrollIntoView({ 
      behavior: 'smooth'
    })

    return activeMarkIndex()
  })


  return (
    <div class="flex items-center">
      <input
        class="
          min-w-80
          bg-gray-50 border
          border-gray-300
          text-gray-900
          text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
        type="search"
        placeholder="Search"
        value={searchText()}
        onInput={(changeEvent) => {
          setSearchText(changeEvent.target.value);
        }}
      />
      <div
        classList={{
          "font-mono text-xs inline-block text-nowrap px-2": true,
          "text-gray-300": totalMarks() === 0,
        }}
      >
        {(totalMarks() > 0 && activeMarkIndex() + 1) || 0} / {totalMarks()}
      </div>
      <button
        data-search="next"
        classList={{
          "text-gray-300":
            activeMarkIndex() === totalMarks() - 1 || totalMarks() === 0,
        }}
        onClick={() => {
          if (totalMarks() === 0) {
            return;
          }
          if (activeMarkIndex() === totalMarks() - 1) {
            return;
          }
          setActiveMarkIndex(activeMarkIndex() + 1);
        }}
      >
        &darr;
      </button>
      <button
        data-search="prev"
        classList={{
          "text-gray-300": activeMarkIndex() === 0 || totalMarks() === 0,
        }}
        onClick={() => {
          if (totalMarks() === 0) {
            return;
          }
          if (activeMarkIndex() === 0) {
            return;
          }
          setActiveMarkIndex(activeMarkIndex() - 1);
        }}
      >
        &uarr;
      </button>
      <button
        data-search="clear"
        onClick={() => {
          setSearchText("");
          setActiveMarkIndex(0);
        }}
      >
        ✖
      </button>
    </div>
  );
}
