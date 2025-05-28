import { For, Suspense } from "solid-js";
import { groupedVideos, setActivePlaylist, activePlaylist } from "../data/simple";

export default function PlayistSelector() {
  

  return (<Suspense>
    <div class="flex border-2 border-slate-300 rounded-lg divide-x-2">
      <For each={groupedVideos()}>{({playlist}) => (
        <button
          classList={{
            "hover:bg-sky-100 focus:bg-sky-100 w-full py-2": true,
            "bg-sky-200": playlist === activePlaylist(),
          }}
          onClick={()=> {
            setActivePlaylist(playlist)
          }}>{playlist}</button>)}
      </For>
    </div>
  </Suspense>)
}