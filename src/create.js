export default ({ events, dom }) => {
  const menu = document.querySelector('#floating-menu');
  const trigger = document.querySelector('#create');
  const image = document.querySelector('#create-image');
  const note = document.querySelector('#create-note');

  const getFile = () => {
    return new Promise(resolve => {
      const input = dom.classname(
        dom.props(dom.elem('input'), { type: 'file' }),
        'invisible'
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
    menu.classList.remove('open');
    
    getFile().then(file => {
      if (!file) {
        return;
      }
      
      events.emit('receive-share', { file });
    });
  };
  
  const onNote = () => {
    menu.classList.remove('open');
    events.emit('receive-share', {
      title: '',
      text: ''
    });
  };

  const onCreate = () => {
    menu.classList.toggle('open');
  };

  trigger.addEventListener('click', onCreate);
  image.addEventListener('click', onImage);
  note.addEventListener('click', onNote);

  return () => {
    trigger.removeEventListener('click', onCreate);
    image.removeEventListener('click', onImage);
    note.removeEventListener('click', onNote);
  };
};
