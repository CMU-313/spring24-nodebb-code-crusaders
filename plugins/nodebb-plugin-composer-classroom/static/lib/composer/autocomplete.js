'use strict';

define('composer/autocomplete', [
	'composer/preview', '@textcomplete/core', '@textcomplete/textarea', '@textcomplete/contenteditable',
], function (preview, { Textcomplete }, { TextareaEditor }, { ContenteditableEditor }) {
	const autocomplete = {
		_active: {},
	};

	$(window).on('action:composer.discard', function (evt, data) {
		if (autocomplete._active.hasOwnProperty(data.post_uuid)) {
			autocomplete._active[data.post_uuid].destroy();
			delete autocomplete._active[data.post_uuid];
		}
	});

	autocomplete.init = function (postContainer, post_uuid) {
		const element = postContainer.find('.write');
		const dropdownClass = 'composer-autocomplete-dropdown-' + post_uuid;
		let timer;

		if (!element.length) {
			/**
			 * Some composers do their own thing before calling autocomplete.init() again.
			 * One reason is because they want to override the textarea with their own element.
			 * In those scenarios, they don't specify the "write" class, and this conditional
			 * looks for that and stops the autocomplete init process.
			 */
			return;
		}

		const data = {
			element,
			strategies: [],
			options: {
				style: {
					'z-index': 20000,
				},
				className: dropdownClass + ' dropdown-menu textcomplete-dropdown',
			},
		};

		element.on('keyup', function () {
			clearTimeout(timer);
			timer = setTimeout(function () {
				const dropdown = document.querySelector('.' + dropdownClass);
				if (dropdown) {
					const pos = dropdown.getBoundingClientRect();

					const margin = parseFloat(dropdown.style.marginTop, 10) || 0;

					const offset = window.innerHeight + margin - 10 - pos.bottom;
					dropdown.style.marginTop = Math.min(offset, 0) + 'px';
				}
			}, 0);
		});

		$(window).trigger('composer:autocomplete:init', data);

		autocomplete._active[post_uuid] = autocomplete.setup(data);

		data.element.on('textComplete:select', function () {
			preview.render(postContainer);
		});
	};

	// This is a generic method that is also used by the chat
	autocomplete.setup = function ({ element, strategies, options }) {
		const targetEl = element.get(0);
		if (!targetEl) {
			return;
		}
		let editor;
		if (targetEl.nodeName === 'TEXTAREA') {
			editor = new TextareaEditor(targetEl);
		} else if (targetEl.nodeName === 'DIV' && targetEl.getAttribute('contenteditable') === 'true') {
			editor = new ContenteditableEditor(targetEl);
		}

		// yuku-t/textcomplete inherits directionality from target element itself
		targetEl.setAttribute('dir', document.querySelector('html').getAttribute('data-dir'));

		const textcomplete = new Textcomplete(editor, strategies, {
			dropdown: options,
		});
		textcomplete.on('rendered', function () {
			if (textcomplete.dropdown.items.length) {
				// Activate the first item by default.
				textcomplete.dropdown.items[0].activate();
			}
		});

		return textcomplete;
	};

	return autocomplete;
});
