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
        console.log(displayBtn)
    }

    return anonymous;
});