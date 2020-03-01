export default ({ events, dom }) => {
  const button = document.querySelector('#create');

  const sampleFileShare = () => {
    const input = dom.props(dom.elem('input'), { type: 'file' });
    const splash = dom.children(
      dom.classname(dom.div(), 'splash', 'limit'),
      dom.children(dom.div(), dom.text('Select a file to show sample share')),
      input
    );

    document.body.appendChild(splash);

    input.onchange = (ev) => {
      const file = ev.target.files[0];

      splash.remove();

      if (file) {
        events.emit('receive-share', { file });
      }
    };
  };

  const onCreate = () => {
    events.emit('receive-share', {
      title: '',
      text: ''
    });
  };

  button.addEventListener('click', onCreate);

  return () => {
    button.removeEventListener('click', onCreate);
  };
};
