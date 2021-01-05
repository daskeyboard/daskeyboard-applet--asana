const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://app.asana.com/api/1.0';

function getTimestamp() {
  var d = new Date(Date.now()),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

class Asana extends q.DesktopApp {
  constructor() {
    super();
    this.timestamp = getTimestamp();
    // For checking tasks seen status
    this.tasksSeen = {};
    // For checking tasks seen status
    this.tasksUpdated = {};
    // For checking plural or singular
    this.notification = "";
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
        const workspaceId = user.workspaces[0].gid;
        const query = `/workspaces/${workspaceId}/tasks/search`;
        const proxyRequest = new q.Oauth2ProxyRequest({
          apiKey: this.authorization.apiKey,
          uri: queryUrlBase + query,
          method: 'GET',
          qs: {
            'assignee.any': 'me',
            'created_on.after': this.timestamp,
            'opt_fields': 'name,assignee.email,completed,assignee_status,modified_at',
            'limit': 100
          },
        });
        return (this.oauth2ProxyRequest(proxyRequest));
      }
    }).then(json => {
      return json.data.filter(task => {
        return ((this.tasksUpdated[task.gid] != task.modified_at) && (task.assignee_status === 'new' ||
          task.assignee_status === 'inbox'));
      });

    }).then(list => {
      for (let task of list) {
        // For updating tasks updated
        this.tasksUpdated[task.gid] = task.modified_at;
      }
      return list;
    });
  }

  async run() {
    logger.info("Asana running.");
    return this.getNewTasks().then(newTasks => {
      this.timestamp = getTimestamp();
      if (newTasks && newTasks.length > 0) {
        logger.info("Got " + newTasks.length + " notification.");

        if (newTasks.length == 1) {
          this.notification = "notification";
        } else {
          this.notification = "notifications";
        }

        return new q.Signal({
          points: [
            [new q.Point("#0000FF", q.Effects.BLINK)]
          ],
          name: `Asana`,
          message: `You have ${newTasks.length} ${this.notification}.`,
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
      if(`${error.message}`.includes("getaddrinfo")){
        // Do not send signal error when getting internet connection error.
        // return q.Signal.error(
        //   'The Asana service returned an error. <b>Please check your internet connection</b>.'
        // );
      }else{
        return q.Signal.error([
          'The Asana service returned an error. <b>Please check your account</b>.',
          `Detail: ${message}`
        ]);
      }
      // throw new Error(message);
    })
  }
}


module.exports = {
  Asana: Asana
}

const applet = new Asana();