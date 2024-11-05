// // src/components/ToggleSwitch.tsx

// import { Component } from '../core/component';
// import { VNode } from '../core/vdom';
// import { store } from '../store';
// import { effect } from '../core/reactive';

// interface ToggleSwitchProps {
//   label: string;
// }

// interface ToggleSwitchState {
//   isOn: boolean;
// }

// export class ToggleSwitch extends Component<ToggleSwitchProps, ToggleSwitchState> {
//   protected initialState(): ToggleSwitchState {
//     return {
//       isOn: false,
//     };
//   }

//   componentDidMount(): void {
//     this.subscribeToStore(() => {
//       this.setState({ isOn: store.toggleState });
//     });
//   }

//   toggle = () => {
//     store.toggleState = !store.toggleState;
//   };

//   render(): VNode {
//     const switchClasses = this.state.isOn ? 'bg-blue-500' : 'bg-gray-300';
//     return (
//       <div class="flex items-center">
//         <span class="mr-2">{this.props.label}</span>
//         <button
//           class={`w-12 h-6 rounded-full transition-colors duration-300 ${switchClasses} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//           onClick={this.toggle}
//         >
//           <span class="inline-block w-6 h-6 bg-white rounded-full transform transition-transform duration-300" style={{ transform: this.state.isOn ? 'translateX(100%)' : 'translateX(0)' }}></span>
//         </button>
//       </div>
//     );
//   }
// }
