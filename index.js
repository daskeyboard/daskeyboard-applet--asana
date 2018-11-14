const q = require('daskeyboard-applet');
const Asana = require('asana');

const logger = q.logger;

async function getNewTasks(token) {
  var client = Asana.Client.create().useAccessToken(token);
  return client.users.me()
    .then(user => {
      const userId = user.id;
      const workspaceId = user.workspaces[0].id;
      return client.tasks.findAll({
        assignee: userId,
        workspace: workspaceId,
        completed_since: 'now',
        opt_fields: 'id,name,assignee_status,completed'
      });
    })
    .then(response => {
      return response.data;
    })
    .filter(task => {
      return task.assignee_status === 'new'
        || task.assignee_status === 'inbox'
        ;
    })
    .then(list => {
      return list;
    })
    .catch(e => {
      logger.error(e);
    });
}

class Trello extends q.DesktopApp {
  async run() {
    console.log("Running.");
    return getNewTasks(this.authorization.token).then(newTasks => {
      if (newTasks && newTasks.length > 0) {
        logger.info("Got " + newTasks.length + " new actions.");
        return new q.Signal([
          [new q.Point("#00FF00")]
        ]);
      } else {
        return null;
      }
    })
  }
}


module.exports = {
  getNewTasks: getNewTasks,
  Trello: Trello
}

const applet = new Trello();