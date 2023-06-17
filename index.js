import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

/* main */ {
    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false,
    }));

    const httpPort = process.env.PORT || 3000;
    let members = [];

    app.get('/peek', (_, res) => {
        res.json({
            online: members.map((member) => member.id),
        });
    });

    app.get('/join', (req, res) => {
        const memberId = req.query.name || Date.now();
        members.push({
            id: memberId,
            response: res,
        });
        console.log(`${memberId} joined.`);

        req.on('close', () => {
            console.log(`${memberId} left.`);
            members = members.filter((member) => member.id !== memberId);
        });

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        });
    });

    app.post('/fact', (req, res) => {
        const { fact } = req.body || {};
        const memberId = req.headers['X-Member-Id'] || req.headers['x-member-id'];
        if (members.map((member) => member.id).includes(memberId)) {
            res.sendStatus(201);
            const data = chunk(`${memberId} shared a fact "${fact}" at ${Date.now()}.`);
            members
                .filter((member) => member.id !== memberId)
                .forEach((member) => member.response.write(data));
        } else {
            res.sendStatus(403);
        }
    });

    app.listen(httpPort, () => {
        console.log(`Server listening on port ${httpPort}.`);
    });
}

/**
 * Creates an SSE chunk with a specific data.
 * @param {String} data the data.
 */
function chunk(data = '') {
    return `data: ${data}\n\n`;
}