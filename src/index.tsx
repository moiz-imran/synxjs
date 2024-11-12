import { createElement } from './core/vdom';
import { App } from './components/App';
import { renderApp } from './core/renderer';
import './styles/tailwind.css';
import { VNode } from 'core/types';

/**
 * Assign createElement globally for JSX to work
 */
window.createElement = createElement;

/**
 * Initialize and render the App
 */
const root = document.getElementById('root');
if (root) {
  renderApp(root, (<App />) as VNode);
} else {
  console.error('Root container not found!');
}
