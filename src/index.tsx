// src/index.ts

import { createElement } from './core/vdom';
import { App } from './components/App';
import { renderApp } from './core/renderer';
import './styles/tailwind.css'; // Import Tailwind CSS

/**
 * Assign createElement and Fragment globally for JSX to work
 */
(window as any).createElement = createElement;

/**
 * Initialize and render the App
 */
const appVNode = App({});
const root = document.getElementById('root');

if (root) {
  renderApp(root, appVNode);
} else {
  console.error('Root container not found!');
}
