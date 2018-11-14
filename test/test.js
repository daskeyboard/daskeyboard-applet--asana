const assert = require('assert');
const t = require('../index');
const auth = require('./auth.json');
const token = auth.token;

console.log("My token is: " + token);

describe('getNewTasks', function () {
  it('can get new tasks', function () {
    return t.getNewTasks(token).then((tasks) => {
      console.log("Tasks: ", tasks);
      assert.ok(tasks);
      assert.ok(tasks[0]);
      assert.ok(tasks[0].id);
    }).catch((error) => {
      assert.fail(error);
    })
  })
});

describe('Trello', () => {
  async function makeApp() {
    let app = new t.Trello();

    await app.processConfig({
      extensionId: 777,
      geometry: {
        width: 1,
        height: 1,
      },
      authorization: auth,
      applet: {}
    });

    return app;
  }

  describe('#run()', () => {
    return makeApp().then(app => {
      return app.run().then((signal) => {
        console.log(signal);
        assert.ok(signal);
      }).catch((error) => {
        assert.fail(error)
      });
    })
  });
})