'use strict'

define('composer/preview', ['hooks'], function (hooks) {
  const preview = {}

  preview.render = function (postContainer, callback) {
    callback = callback || function () {}
    if (!postContainer.find('.preview-container').is(':visible')) {
      return callback()
    }

    const textarea = postContainer.find('textarea')

    socket.emit('plugins.composer.renderPreview', textarea.val(), function (err, preview) {
      if (err) {
        return
      }
      preview = $('<div>' + preview + '</div>')
      preview.find('img:not(.not-responsive)').addClass('img-responsive')
      postContainer.find('.preview').html(preview)
      hooks.fire('action:composer.preview')
      callback()
    })
  }

  preview.matchScroll = function (postContainer) {
    if (!postContainer.find('.preview-container').is(':visible')) {
      return
    }
    const textarea = postContainer.find('textarea')
    const preview = postContainer.find('.preview')

    if (textarea.length && preview.length) {
      const diff = textarea[0].scrollHeight - textarea.height()

      if (diff === 0) {
        return
      }

      const scrollPercent = textarea.scrollTop() / diff

      preview.scrollTop(Math.max(preview[0].scrollHeight - preview.height(), 0) * scrollPercent)
    }
  }

  preview.handleToggler = function (postContainer) {
    preview.env = utils.findBootstrapEnvironment()
    const showBtn = postContainer.find('.write-container .toggle-preview')
    const hideBtn = postContainer.find('.preview-container .toggle-preview')
    const previewContainer = $('.preview-container')
    const writeContainer = $('.write-container')

    function hidePreview () {
      togglePreview(false)
      if (preview.env !== 'xs' && preview.env !== 'sm') {
        localStorage.setItem('composer:previewToggled', true)
      }
    }

    function showPreview () {
      togglePreview(true)
      if (preview.env !== 'xs' && preview.env !== 'sm') {
        localStorage.removeItem('composer:previewToggled')
      }
    }

    function togglePreview (show) {
      if (preview.env === 'xs' || preview.env === 'sm') {
        previewContainer.toggleClass('hide', false)
        writeContainer.toggleClass('maximized', false)
        showBtn.toggleClass('hide', true)
        previewContainer.toggleClass('hidden-xs hidden-sm', !show)
        writeContainer.toggleClass('hidden-xs hidden-sm', show)

        // Render preview once on mobile
        if (show) {
          preview.render(postContainer)
        }
      } else {
        previewContainer.toggleClass('hide', !show)
        writeContainer.toggleClass('maximized', !show)
        showBtn.toggleClass('hide', show)
      }

      preview.matchScroll(postContainer)
    }
    preview.toggle = togglePreview

    hideBtn.on('click', function () {
      hidePreview()
      postContainer.find('.write').focus()
    })
    showBtn.on('click', function () {
      showPreview()
      postContainer.find('.write').focus()
    })

    if (localStorage.getItem('composer:previewToggled') || (preview.env === 'xs' || preview.env === 'sm')) {
      hidePreview()
    } else {
      showPreview()
    }
  }

  return preview
})
