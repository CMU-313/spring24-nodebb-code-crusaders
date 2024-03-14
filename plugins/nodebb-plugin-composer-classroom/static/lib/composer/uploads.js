'use strict';

define('composer/uploads', [
	'composer/preview',
	'composer/categoryList',
	'translator',
	'alerts',
	'uploadHelpers',
	'jquery-form',
], function (preview, categoryList, translator, alerts, uploadHelpers) {
	const uploads = {
		inProgress: {},
	};

	let uploadingText = '';

	uploads.initialize = function (post_uuid) {
		initializeDragAndDrop(post_uuid);
		initializePaste(post_uuid);

		addChangeHandlers(post_uuid);
		addTopicThumbHandlers(post_uuid);
		translator.translate('[[modules:composer.uploading, ' + 0 + '%]]', function (translated) {
			uploadingText = translated;
		});
	};

	function addChangeHandlers(post_uuid) {
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');

		postContainer.find('#files').on('change', function (e) {
			const files = (e.target || {}).files ||
				($(this).val() ? [{ name: $(this).val(), type: utils.fileMimeType($(this).val()) }] : null);
			if (files) {
				uploadContentFiles({ files, post_uuid, route: '/api/post/upload' });
			}
		});
	}

	function addTopicThumbHandlers(post_uuid) {
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');

		postContainer.on('click', '.topic-thumb-clear-btn', function (e) {
			postContainer.find('input#topic-thumb-url').val('').trigger('change');
			resetInputFile(postContainer.find('input#topic-thumb-file'));
			$(this).addClass('hide');
			e.preventDefault();
		});

		postContainer.on('paste change keypress', 'input#topic-thumb-url', function () {
			const urlEl = $(this);
			setTimeout(function () {
				const url = urlEl.val();
				if (url) {
					postContainer.find('.topic-thumb-clear-btn').removeClass('hide');
				} else {
					resetInputFile(postContainer.find('input#topic-thumb-file'));
					postContainer.find('.topic-thumb-clear-btn').addClass('hide');
				}
				postContainer.find('img.topic-thumb-preview').attr('src', url);
			}, 100);
		});
	}

	function resetInputFile($el) {
		$el.wrap('<form />').closest('form').get(0).reset();
		$el.unwrap();
	}

	function initializeDragAndDrop(post_uuid) {
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		uploadHelpers.handleDragDrop({
			container: postContainer,
			callback: function (upload) {
				uploadContentFiles({
					files: upload.files,
					post_uuid,
					route: '/api/post/upload',
					formData: upload.formData,
				});
			},
		});
	}

	function initializePaste(post_uuid) {
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		uploadHelpers.handlePaste({
			container: postContainer,
			callback: function (upload) {
				uploadContentFiles({
					files: upload.files,
					fileNames: upload.fileNames,
					post_uuid,
					route: '/api/post/upload',
					formData: upload.formData,
				});
			},
		});
	}

	function escapeRegExp(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	function insertText(str, index, insert) {
		return str.slice(0, index) + insert + str.slice(index);
	}

	function uploadContentFiles(params) {
		const files = [...params.files];
		const post_uuid = params.post_uuid;
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		const textarea = postContainer.find('textarea');
		let text = textarea.val();
		const uploadForm = postContainer.find('#fileForm');
		let doneUploading = false;
		uploadForm.attr('action', config.relative_path + params.route);

		let cid = categoryList.getSelectedCid();
		if (!cid && ajaxify.data.cid) {
			cid = ajaxify.data.cid;
		}
		let i = 0;
		let isImage = false;
		for (i = 0; i < files.length; ++i) {
			isImage = files[i].type.match(/image./);
			if ((isImage && !app.user.privileges['upload:post:image']) || (!isImage && !app.user.privileges['upload:post:file'])) {
				return alerts.error('[[error:no-privileges]]');
			}
		}

		const filenameMapping = [];

		for (i = 0; i < files.length; ++i) {
			// The filename map has datetime and iterator prepended so that they can be properly tracked even if the
			// filenames are identical.
			filenameMapping.push(i + '_' + Date.now() + '_' + (params.fileNames ? params.fileNames[i] : files[i].name));
			isImage = files[i].type.match(/image./);

			if (files[i].size > parseInt(config.maximumFileSize, 10) * 1024) {
				uploadForm[0].reset();
				return alerts.error('[[error:file-too-big, ' + config.maximumFileSize + ']]');
			}

			text = insertText(text, textarea.getCursorPosition(), (isImage ? '!' : '') + '[' + filenameMapping[i] + '](' + uploadingText + ') ');
		}
		if (uploadForm.length) {
			postContainer.find('[data-action="post"]').prop('disabled', true);
		}
		textarea.val(text);

		$(window).trigger('action:composer.uploadStart', {
			post_uuid,
			files: filenameMapping.map(function (filename, i) {
				return {
					filename: filename.replace(/^\d+_\d{13}_/, ''),
					isImage: /image./.test(files[i].type),
				};
			}),
			text: uploadingText,
		});

		uploadForm.off('submit').submit(function () {
			function updateTextArea(filename, text, trim) {
				let newFilename;
				if (trim) {
					newFilename = filename.replace(/^\d+_\d{13}_/, '');
				}
				const current = textarea.val();
				const re = new RegExp(escapeRegExp(filename) + ']\\([^)]+\\)', 'g');
				textarea.val(current.replace(re, (newFilename || filename) + '](' + text + ')'));

				$(window).trigger('action:composer.uploadUpdate', {
					post_uuid,
					filename,
					text,
				});
			}

			uploads.inProgress[post_uuid] = uploads.inProgress[post_uuid] || [];
			uploads.inProgress[post_uuid].push(1);

			if (params.formData) {
				params.formData.append('cid', cid);
			}

			$(this).ajaxSubmit({
				headers: {
					'x-csrf-token': config.csrf_token,
				},
				resetForm: true,
				clearForm: true,
				formData: params.formData,
				data: { cid },

				error: function (xhr) {
					doneUploading = true;
					postContainer.find('[data-action="post"]').prop('disabled', false);
					const errorMsg = onUploadError(xhr, post_uuid);
					for (let i = 0; i < files.length; ++i) {
						updateTextArea(filenameMapping[i], errorMsg, true);
					}
					preview.render(postContainer);
				},

				uploadProgress: function (event, position, total, percent) {
					translator.translate('[[modules:composer.uploading, ' + percent + '%]]', function (translated) {
						if (doneUploading) {
							return;
						}
						for (let i = 0; i < files.length; ++i) {
							updateTextArea(filenameMapping[i], translated);
						}
					});
				},

				success: function (res) {
					const uploads = res.response.images;
					doneUploading = true;
					if (uploads && uploads.length) {
						for (let i = 0; i < uploads.length; ++i) {
							uploads[i].filename = filenameMapping[i].replace(/^\d+_\d{13}_/, '');
							uploads[i].isImage = /image./.test(files[i].type);
							updateTextArea(filenameMapping[i], uploads[i].url, true);
						}
					}
					preview.render(postContainer);
					textarea.focus();
					postContainer.find('[data-action="post"]').prop('disabled', false);
					$(window).trigger('action:composer.upload', {
						post_uuid,
						files: uploads,
					});
				},

				complete: function () {
					uploadForm[0].reset();
					uploads.inProgress[post_uuid].pop();
				},
			});

			return false;
		});

		uploadForm.submit();
	}

	function onUploadError(xhr, post_uuid) {
		let msg = (xhr.responseJSON &&
			(xhr.responseJSON.error || (xhr.responseJSON.status && xhr.responseJSON.status.message))) ||
			'[[error:parse-error]]';

		if (xhr && xhr.status === 413) {
			msg = xhr.statusText || 'Request Entity Too Large';
		}
		alerts.error(msg);
		$(window).trigger('action:composer.uploadError', {
			post_uuid,
			message: msg,
		});
		return msg;
	}

	return uploads;
});
