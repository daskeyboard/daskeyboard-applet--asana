const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://app.asana.com/api/1.0';

function getTimestamp(date) {
  date = date || new Date();
  // Asana API docs say it accepts ISO-8601, but that doesn't actually work
  return date.toISOString().substring(0,10);
}

class Asana extends q.DesktopApp {
  constructor() {
    super();
    this.timestamp = getTimestamp();
    this.tasksSeen = {};
  }
  async getMe() {
    const query = "/users/me";
    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user workspaces
    return this.oauth2ProxyRequest(proxyRequest);
  }

  async getNewTasks() {
    // first get the user workspaces
    return this.getMe().then(json => {
      const user = json.data;
      if (user.workspaces && user.workspaces.length) {
        const workspaceId = user.workspaces[0].id;

        const query = `/workspaces/${workspaceId}/tasks/search`;
        const proxyRequest = new q.Oauth2ProxyRequest({
          apiKey: this.authorization.apiKey,
          uri: queryUrlBase + query,
          method: 'GET',
          qs: {
            'assignee.any': 'me',
            'created_on.after': this.timestamp,
            'completed': "false",
            'opt_fields': 'name,assignee.email,completed,assignee_status',
            'limit': 100
          },
        });

        return (this.oauth2ProxyRequest(proxyRequest));
      }
    }).then(json => {
      return json.data.filter(task => {
        return !this.tasksSeen[task.id] && (task.assignee_status === 'new' ||
          task.assignee_status === 'inbox');
      });
    })
      .then(list => {
        for (let task of list) {
          this.tasksSeen[task.id] = 1;
        }
        return list;
      });
  }

  async run() {
    console.log("Running.");
    return this.getNewTasks().then(newTasks => {
      this.timestamp = getTimestamp();
      if (newTasks && newTasks.length > 0) {
        logger.info("Got " + newTasks.length + " new actions.");
        return new q.Signal({
          points: [
            [new q.Point("#00FF00")]
          ],
          name: `Asana`,
          message: `You have ${newTasks.length} new action(s) in Asana.`,
          link: {
            url: 'https://app.asana.com/0/inbox',
            label: 'Show in Asana',
          },
        });
      } else {
        return null;
      }
    }).catch(error => {
      const message = error.statusCode == 402
        ? 'Payment required. This applet requires a premium Asana account.' : error;
      logger.error(`Sending error signal: ${message}`);
      throw new Error(message);
    })
  }
}


module.exports = {
  Asana: Asana
}

const applet = new Asana();