const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://app.asana.com/api/1.0';

class Asana extends q.DesktopApp {
  async getNewTasks() {

    let query = "/users/me";
    let proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user workspaces
    return this.oauth2ProxyRequest(proxyRequest).then(json => {
        const user = json.data;
        if (user.workspaces && user.workspaces.length) {
          const workspaceId = user.workspaces[0].id;

          query = `/workspaces/${workspaceId}/tasks/search`;
          proxyRequest = new q.Oauth2ProxyRequest({
            apiKey: this.authorization.apiKey,
            uri: queryUrlBase + query,
            method: 'GET',
            qs: {
              'assignee.any': 'me',
              'opt_fields': 'name,assignee.email,completed,assignee_status',
              'limit': 100
            },
          });

          return (this.oauth2ProxyRequest(proxyRequest));
        }
      }).then(json => {
        return json.data.filter(task => {
          return task.assignee_status === 'new' ||
            task.assignee_status === 'inbox';
        });
      })
      .then(list => {
        return list;
      })
      .catch(e => {
        logger.error(e);
      });
  }

  async run() {
    console.log("Running.");
    return this.getNewTasks().then(newTasks => {
      if (newTasks && newTasks.length > 0) {
        logger.info("Got " + newTasks.length + " new actions.");
        return new q.Signal({
          points: [
            [new q.Point("#00FF00")]
          ],
          name: `You have ${newTasks.length} new tasks in Asana.`
        });
      } else {
        return null;
      }
    })
  }
}


module.exports = {
  Asana: Asana
}

const applet = new Asana();