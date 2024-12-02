import { renderApp } from '@synxjs/core';
import { VNode } from '@synxjs/types';
import { App } from './components/App';
import './styles/tailwind.css';

const root = document.getElementById('root');
if (root) {
  renderApp(root, (<App />) as VNode);
} else {
  console.error('Root container not found!');
}
