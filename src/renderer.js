export default ({ events, db, dom }) => {
  const elem = document.querySelector('#main');

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

  const onRender = async () => {
    const cards = [].slice.call(document.querySelectorAll('.card'))
      .map(card => {
        return {
          card, id: Number(card.getAttribute('data-id'))
        };
      });

    let currentCard;

    await db.each(null, record => {
      const card = dom.props(dom.div('card'), {
        'data-id': record.id
      });

      const idx = cards.findIndex(c => c.id === record.id);

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

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
  };

  events.on('render', onRender);

  return () => {
    events.on('render', onRender);
  };
};
