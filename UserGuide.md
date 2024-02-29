Anonymous posting:

To use this feature, install and enable the nodebb-plugin-composer-classroom plugin and disable the default composer. When making an anonymous post, click the checkbox in the post composer UI before clicking "Submit."
Posts made this way will be tagged as anonymous in the DB and should display "Anonymous" instead of the author's username.
Tests for this are present in `test/topics.js`.

Installation:

From the root directory, run:
```
cd plugins/nodebb-plugin-composer-classroom
npm link
cd ../../
npm link nodebb-plugin-composer-classroom
./nodebb build
./nodebb reset -p nodebb-plugin-composer-default
```
