type AnonymousObject = {
  init: ($postContainer: JQuery<HTMLElement>) => void;
  getBtnState: () => boolean;
};

export default function (): AnonymousObject {
	const state: { isToggled: boolean } = {
		isToggled: false,
	};

	let displayBtn: Element | null;

	function handleClick(): void {
		state.isToggled = !state.isToggled;
		console.log(state.isToggled);
	}

	function init($postContainer: JQuery<HTMLElement>) {
		state.isToggled = false;

		displayBtn = $postContainer[0].querySelector('.display-anonymous-posting');

		displayBtn?.addEventListener('click', handleClick);
	}

	function getBtnState(): boolean {
		return state.isToggled;
	}

	const anonymous: AnonymousObject = {
		init: init,
		getBtnState: getBtnState,
	};

	return anonymous;
}
