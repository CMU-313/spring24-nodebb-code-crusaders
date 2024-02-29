import JQuery from 'jquery';

type AnonymousObject = {
  // think this might be an issue with eslint
  // eslint-disable-next-line no-unused-vars
  init: ($postContainer: JQuery<HTMLElement>) => void;
  getBtnState: () => number;
};

export default function (): AnonymousObject {
	const state: { isToggled: number } = {
		isToggled: 0,
	};

	let displayBtn: Element | null;

	function handleClick(): void {
		state.isToggled = Math.abs(state.isToggled - 1);
	}

	function init($postContainer: JQuery<HTMLElement>) {
		state.isToggled = 0;

		displayBtn = $postContainer[0].querySelector('.display-anonymous-posting');

		if (displayBtn) {
			displayBtn.addEventListener('click', handleClick);
		}
	}

	function getBtnState(): number {
		return state.isToggled;
	}

	const anonymous: AnonymousObject = {
		init: init,
		getBtnState: getBtnState,
	};

	return anonymous;
}
