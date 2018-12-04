const assert = require('assert');
const {
  Asana
} = require('../index');
const auth = require('./auth.json');

console.log("My auth is: " + JSON.stringify(auth));

describe('Asana', () => {
  async function makeApp() {
    let app = new Asana();

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

  describe('getNewTasks', async function () {
    it('can get new tasks', async function () {
      this.timeout(5000);
      return makeApp().then(app => {
        return app.getNewTasks().then((tasks) => {

          console.log("Tasks: ", tasks);
          assert.ok(tasks);
          assert.ok(tasks[0]);
          assert.ok(tasks[0].id);
        }).catch((error) => {
          assert.fail(error);
        })
      });
    })
  });

  describe('#run()', async () => {
    const app = await makeApp();
    return app.run().then((signal) => {
      console.log(signal);
      assert.ok(signal);
    }).catch((error) => {
      assert.fail(error)
    });
  });
})