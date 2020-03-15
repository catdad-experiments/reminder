//import { html, render } from 'https://cdn.jsdelivr.net/npm/htm@3.0.3/preact/standalone.module.js';
//import { Fragment } from 'https://cdn.jsdelivr.net/npm/preact@10.3.4/dist/preact.module.js';

import { h, render, Fragment } from 'https://cdn.jsdelivr.net/npm/preact@10.3.4/dist/preact.module.js';
import htm from 'https://cdn.jsdelivr.net/npm/htm@3.0.3/dist/htm.module.js';
const html = htm.bind(h);

export { html, render, Fragment };
