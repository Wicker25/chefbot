// NOTE: Original source at https://github.com/FirebaseExtended/functions-cron
const express = require('express');
const PubSub = require('@google-cloud/pubsub');

const pubsubClient = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const app = express();

app.get('/publish/:topic', async (request, response) => {
  const topic = request.params['topic'];

  try {
    await pubsubClient
      .topic(topic)
      .publisher()
      .publish(Buffer.from('test'));

    response.status(200).end();
  } catch (e) {
    response.status(500).end();
  }
});

const PORT = process.env.PORT || 6060;
app.listen(PORT);
