// src/components/ThemeSwitcher.tsx

import { Component } from '../core/component';
import { VNode } from '../core/vdom';
import { store } from '../store';

interface ThemeSwitcherProps {
  // The unique key is handled externally; no need to include it here
}

interface ThemeSwitcherState {
  currentTheme: 'light' | 'dark';
}

export class ThemeSwitcher extends Component<
  ThemeSwitcherProps,
  ThemeSwitcherState
> {
  protected initialState(): ThemeSwitcherState {
    return {
      currentTheme: store.theme,
    };
  }

  constructor(props: ThemeSwitcherProps) {
    super(props);
  }

  componentDidMount(): void {
    // Subscribe to the 'theme' property in the store
    this.subscribeToStore(() => {
      this.setState({ currentTheme: store.theme });
      this.applyTheme();
    });
    this.applyTheme();
  }

  toggleTheme = () => {
    store.theme = store.theme === 'light' ? 'dark' : 'light';
  };

  applyTheme(): void {
    const root = document.documentElement;
    if (this.state.currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  render(): VNode {
    return (
      <button
        className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          this.state.currentTheme === 'light'
            ? 'bg-gray-800 text-white'
            : 'bg-yellow-300 text-black'
        }`}
        onClick={this.toggleTheme}
      >
        Switch to {this.state.currentTheme === 'light' ? 'Dark' : 'Light'} Mode
      </button>
    );
  }
}
