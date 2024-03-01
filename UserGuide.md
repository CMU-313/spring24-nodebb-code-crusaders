# Anonymous posting:

To use this feature, install and enable the nodebb-plugin-composer-classroom plugin and disable the default composer. When making an anonymous post, click the checkbox in the post composer UI before clicking "Submit."
Posts made this way will be tagged as anonymous in the DB and should display "Anonymous" instead of the author's username.
Tests for this are present in `test/topics.js`. Tests focus on topic creation and default behavior, as well as ensuring the topic API is correctly adding anonymous to posts.
Tests are sufficient due to covering default and generic conditions, and due to the fact that additional impacts for anonymous posting are minimal.

## Installation:
From the root directory, run:
```
cd plugins/nodebb-plugin-composer-classroom
npm link
cd ../../
npm link nodebb-plugin-composer-classroom
./nodebb build
./nodebb reset -p nodebb-plugin-composer-default
```
# Mark Best Response:

To use this feature, simply run NodeBB as usual. As a user, one can mark what they believe is the best response in a thread in the "Mark Best Response" checkbox. This will mark that post as the best response.

