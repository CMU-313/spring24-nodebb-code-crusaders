'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
function default_1() {
	const state = {
		isToggled: 0,
	};
	let displayBtn;
	function handleClick() {
		state.isToggled = Math.abs(state.isToggled - 1);
		console.log(state.isToggled);
	}
	function init($postContainer) {
		state.isToggled = 0;
		displayBtn = $postContainer[0].querySelector('.display-anonymous-posting');
		displayBtn === null || displayBtn === void 0 ? void 0 : displayBtn.addEventListener('click', handleClick);
	}
	function getBtnState() {
		return state.isToggled;
	}
	const anonymous = {
		init: init,
		getBtnState: getBtnState,
	};
	return anonymous;
}
exports.default = default_1;
