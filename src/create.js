const OPEN = 'open';

export default ({ events, dom }) => {
  const menu = document.querySelector('#floating-menu');
  const trigger = document.querySelector('#create');
  const image = document.querySelector('#create-image');
  const note = document.querySelector('#create-note');
  let timer;

  const getFile = () => {
    return new Promise(resolve => {
      const input = dom.props(
        dom.classname(dom.elem('input'), 'invisible'),
        { type: 'file' }
      );

      document.body.appendChild(input);

      input.onchange = (ev) => {
        const file = ev.target.files[0];
        input.remove();
        
        resolve(file || null);
      };
      
      input.click();
    });
  };
  
  const onImage = () => {
    menu.classList.remove(OPEN);
    
    getFile().then(file => {
      if (!file) {
        return;
      }
      
      events.emit('receive-share', { file });
    });
  };
  
  const onNote = () => {
    menu.classList.remove(OPEN);
    events.emit('receive-share', {
      title: '',
      text: ''
    });
  };

  const onCreate = () => {
    menu.classList.toggle(OPEN);
  };
  
  const onScroll = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    
    trigger.classList.add(OPEN);
    
    timer = setTimeout(() => {
      trigger.classList.remove(OPEN);
    }, 1000 * 2);
  };

  trigger.addEventListener('click', onCreate);
  image.addEventListener('click', onImage);
  note.addEventListener('click', onNote);
  
  trigger.classList.add(OPEN);
  
  timer = setTimeout(() => {
    trigger.classList.remove(OPEN);
  }, 1000 * 5);
  
  window.addEventListener('scroll', onScroll);

  return () => {
    trigger.removeEventListener('click', onCreate);
    image.removeEventListener('click', onImage);
    note.removeEventListener('click', onNote);

    window.removeEventListener('scroll', onScroll);
    
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
};
