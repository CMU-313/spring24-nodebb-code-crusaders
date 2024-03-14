'use strict';

define('composer/controls', ['composer/preview'], function (preview) {
	const controls = {};

	/** ********************************************** */
	/* Rich Textarea Controls                        */
	/** ********************************************** */
	controls.insertIntoTextarea = function (textarea, value) {
		const payload = {
			context: this,
			textarea,
			value,
			preventDefault: false,
		};
		$(window).trigger('action:composer.insertIntoTextarea', payload);

		if (payload.preventDefault) {
			return;
		}

		const $textarea = $(payload.textarea);
		const currentVal = $textarea.val();
		const postContainer = $textarea.parents('[component="composer"]');

		$textarea.val(
			currentVal.slice(0, payload.textarea.selectionStart) +
			payload.value +
			currentVal.slice(payload.textarea.selectionStart)
		);

		preview.render(postContainer);
	};

	controls.wrapSelectionInTextareaWith = function (textarea, leading, trailing) {
		const payload = {
			context: this,
			textarea,
			leading,
			trailing,
			preventDefault: false,
		};
		$(window).trigger('action:composer.wrapSelectionInTextareaWith', payload);

		if (payload.preventDefault) {
			return;
		}

		if (trailing === undefined) {
			trailing = leading;
		}

		const $textarea = $(textarea);
		const currentVal = $textarea.val();

		let matches = /^(\s*)([\s\S]*?)(\s*)$/.exec(currentVal.slice(textarea.selectionStart, textarea.selectionEnd));

		if (!matches[2]) {
			// selection is entirely whitespace
			matches = [null, '', currentVal.slice(textarea.selectionStart, textarea.selectionEnd), ''];
		}

		$textarea.val(
			currentVal.slice(0, textarea.selectionStart) +
			matches[1] +
			leading +
			matches[2] +
			trailing +
			matches[3] +
			currentVal.slice(textarea.selectionEnd)
		);

		return [matches[1].length, matches[3].length];
	};

	controls.updateTextareaSelection = function (textarea, start, end) {
		const payload = {
			context: this,
			textarea,
			start,
			end,
			preventDefault: false,
		};
		$(window).trigger('action:composer.updateTextareaSelection', payload);

		if (payload.preventDefault) {
			return;
		}

		textarea.setSelectionRange(payload.start, payload.end);
		$(payload.textarea).focus();
	};

	controls.getBlockData = function (textareaEl, query, selectionStart) {
		// Determines whether the cursor is sitting inside a block-type element (bold, italic, etc.)
		let value = textareaEl.value;
		query = query.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
		const regex = new RegExp(query, 'g');
		let match;
		const matchIndices = [];
		let payload;

		// Isolate the line the cursor is on
		value = value.split('\n').reduce(function (memo, line) {
			if (memo !== null) {
				return memo;
			}

			memo = selectionStart <= line.length ? line : null;

			if (memo === null) {
				selectionStart -= (line.length + 1);
			}

			return memo;
		}, null);

		// Find query characters and determine return payload
		while ((match = regex.exec(value)) !== null) {
			matchIndices.push(match.index);
		}

		// eslint-disable-next-line prefer-const
		payload = {
			in: !!(matchIndices.reduce(function (memo, cur) {
				if (selectionStart >= cur + 2) {
					memo += 1;
				}

				return memo;
			}, 0) % 2),
			atEnd: matchIndices.reduce(function (memo, cur) {
				if (memo) {
					return memo;
				}

				return selectionStart === cur;
			}, false),
		};

		payload.atEnd = payload.in ? payload.atEnd : false;
		return payload;
	};

	return controls;
});
