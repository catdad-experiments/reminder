export default ({ events, db, dom }) => {
  const elem = document.querySelector('#main');
  let FOCUS_ID;

  const renderFile = (card, { filebuffer, filename, filetype }) => {
    dom.children(
      card,
      dom.children(
        dom.div('title'),
        dom.text(`${filename} (${filetype})`)
      ),
      dom.img(new Blob([filebuffer]))
    );
  };

  const renderField = field => {
    if (!field) {
      return dom.nill();
    }

    return dom.fragment(
      ...field.split('\n').map(i => i.trim()).map(line => {
        const urls = line.match(/[a-z]+:\/\/[^ ]+/ig);

        if (!urls) {
          return dom.p(line);
        }

        const lineElements = [];
        let tempLine = line;

        for (let url of urls) {
          const [before, ...rest] = tempLine.split(url);

          lineElements.push(dom.span(before));
          lineElements.push(dom.link(url, url));
          tempLine = rest.join(url);
        }

        if (tempLine) {
          lineElements.push(dom.span(tempLine));
        }

        return dom.children(
          dom.p(),
          dom.fragment(...lineElements)
        );
      })
    );
  };

  const renderPlain = (card, { id, title, text, url }) => {
    dom.children(
      card,
      dom.children(dom.div('title'), renderField(title)),
      dom.children(dom.div(), renderField(text)),
      dom.children(dom.div(), renderField(url)),
      dom.children(dom.div(), dom.button('notify', async () => {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body: `${text}`,
          tag: `${id}`
        });
      }))
    );
  };

  const getCards = () => [].slice.call(document.querySelectorAll('.card'))
    .map(card => {
      return {
        card, id: Number(card.getAttribute('data-id'))
      };
    });

  const applyCardFocus = () => {
    getCards().forEach(({ card, id }) => {
      if (id !== FOCUS_ID) {
        return void card.classList.remove('focused');
      }

      card.classList.add('focused');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const onRender = async () => {
    const cards = getCards();

    let currentCard;

    await db.each(null, record => {
      const idx = cards.findIndex(c => c.id === record.id);

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

      const card = dom.props(dom.div('card'), {
        'data-id': record.id
      });

      if (record.filebuffer) {
        renderFile(card, record);
      } else {
        renderPlain(card, record);
      }

      if (currentCard) {
        elem.insertBefore(card, currentCard.card);
      } else {
        elem.insertBefore(card, elem.firstChild);
      }
    });

    applyCardFocus();
  };

  const onRenderFocus = ({ id }) => {
    FOCUS_ID = id;
    applyCardFocus();
  };

  events.on('render', onRender);
  events.on('render-focus', onRenderFocus);

  return () => {
    events.off('render', onRender);
    events.off('render-focus', onRenderFocus);
  };
};
