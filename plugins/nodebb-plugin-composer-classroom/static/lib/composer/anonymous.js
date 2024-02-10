'use strict'

define('composer/anonymous', [], function () {
    const anonymous = {};
    const state = {
        isToggled: false
    }
    let displayBtn;

    anonymous.init = function ($postContainer) {
        state.isToggled = false;

        displayBtn = $postContainer[0].querySelector('.display-anonymous-posting')

        displayBtn.addEventListener('click', handleClick)
    }

    anonymous.getBtnState = function () {
        return state.isToggled;
    }

    function handleClick() {
        state.isToggled = !state.isToggled;
        console.log(state.isToggled);
    }

    return anonymous;
});