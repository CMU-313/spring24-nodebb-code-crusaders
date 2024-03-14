'use strict';

define('forum/compose', ['hooks'], function (hooks) {
    const Compose = {};

    Compose.init = function () {
        const container = $('.composer');
        console.log(container);

        if (container.length) {
            hooks.fire('action:composer.enhance', {
                container: container,
            });
        }
    };

    return Compose;
});
