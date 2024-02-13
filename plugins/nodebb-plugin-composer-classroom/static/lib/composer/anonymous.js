"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    const state = {
        isToggled: false
    };
    let displayBtn;
    function init($postContainer) {
        state.isToggled = false;
        displayBtn = $postContainer[0].querySelector('.display-anonymous-posting');
        displayBtn === null || displayBtn === void 0 ? void 0 : displayBtn.addEventListener('click', handleClick);
    }
    function getBtnState() {
        return state.isToggled;
    }
    const anonymous = {
        init: init,
        getBtnState: getBtnState
    };
    function handleClick() {
        state.isToggled = !state.isToggled;
        console.log(state.isToggled);
    }
    return anonymous;
}
exports.default = default_1;
;
