import { createElement, renderApp } from '@synxjs/core';
import { VNode } from '@synxjs/types';
import { App } from './app';
import './styles/index.css';

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
