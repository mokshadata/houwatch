import { UncontrolledPlyr, createPlyr } from 'solid-plyr';
import { createEffect } from 'solid-js';


export default function Player(props) {
  const [ref, setRef] = createPlyr({ 
    source: props.source,
    // options: props.option,
  });

  createEffect(() => {
    const player = ref()?.plyr;

    if (player) {
      player.on('timeupdate', (event) => {
        // Log current time while playing the playback
        console.log(event.detail.plyr.currentTime);
      });
    }
  })

  return (
    <UncontrolledPlyr ref={setRef} />
  );
}