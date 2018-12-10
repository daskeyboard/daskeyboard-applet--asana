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

  describe('getMe', async function () {
    it('can get my workspaces', async function () {
      this.timeout(5000);
      return makeApp().then(async app => {
        return app.getMe().then((json) => {
          workspaces = json.data.workspaces;
          assert.ok(workspaces);
          assert.ok(workspaces[0]);
          assert.ok(workspaces[0].id);
        }).catch((error) => {
          assert.fail(error);
        })
      });
    })
  });

  describe('getNewTasks', async function () {
    it('can get new tasks', async function () {
      this.timeout(5000);
      return makeApp().then(async app => {
        app.timestamp = '2018-11-01';
        return app.getNewTasks().then((tasks) => {
          assert.ok(tasks);
          assert.ok(tasks[0]);
          assert.ok(tasks[0].id);
        }).catch((error) => {
          assert.fail(error);
        })
      });
    });

    it('ignores old tasks', async function () {
      this.timeout(5000);
      return makeApp().then(async app => {
        app.timestamp = '2025-11-01';
        return app.getNewTasks().then((tasks) => {
          assert.ok(tasks);
          assert.equal(0, tasks.length);
        }).catch((error) => {
          assert.fail(error);
        })
      });
    });

    it('doesn\`t resignal old tasks', async function () {
      this.timeout(5000);
      return makeApp().then(async app => {
        app.timestamp = '2018-11-01';
        return app.getNewTasks().then(async () => {
          app.timestamp = '2018-11-01';
          return app.getNewTasks().then((tasks) => {
            assert.ok(tasks);
            assert.equal(0, tasks.length);
          })
        }).catch((error) => {
          assert.fail(error);
        })
      });
    });
  });

  describe('#run()', function () {
    it('runs', async () => {
      const app = await makeApp();
      return app.run().then((signal) => {
        console.log(signal);
        assert.ok(signal === null || signal);
      }).catch((error) => {
        assert.fail(error)
      });
    });

    it('updates its timestamp', async () => {
      const app = await makeApp();
      app.timestamp = '2018-11-01';
      return app.run().then(() => {
        console.log(`My new timestamp: ${app.timestamp}`);
        assert(app.timestamp > '2018-11-01');
      }).catch((error) => {
        assert.fail(error)
      });
    });

  });
})