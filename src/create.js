const OPEN = 'open';

const shouldHide = () => window.innerHeight < document.body.scrollHeight;

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
    trigger.classList.add(OPEN);
    
    if (menu.classList.contains(OPEN)) {
      menu.classList.remove(OPEN);
      autoClose();
    } else {
      menu.classList.add(OPEN);
      
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
  
  const autoClose = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    
    if (!shouldHide()) {
      return;
    }
    
    timer = setTimeout(() => {
      menu.classList.remove(OPEN);
      trigger.classList.remove(OPEN);
    }, 1000 * 2);
  };
  
  const onRender = () => {
    trigger.classList.add(OPEN);
    autoClose();
  };
  const onScroll = () => {
    trigger.classList.add(OPEN);
    autoClose();
  };

  trigger.addEventListener('click', onCreate);
  image.addEventListener('click', onImage);
  note.addEventListener('click', onNote);
  
  trigger.classList.add(OPEN);
  
  timer = setTimeout(() => {
    if (!shouldHide()) {
      return;
    }

    trigger.classList.remove(OPEN);
  }, 1000 * 5);
  
  window.addEventListener('scroll', onScroll);
  events.on('render-complete', onRender);

  return () => {
    trigger.removeEventListener('click', onCreate);
    image.removeEventListener('click', onImage);
    note.removeEventListener('click', onNote);
    window.removeEventListener('scroll', onScroll);

    events.off('render-complete', onRender);
    
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
};
