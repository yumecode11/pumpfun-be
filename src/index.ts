require('dotenv').config({})

Object.defineProperty(BigInt.prototype, "toJSON", {
    get() {
        "use strict";
        return () => String(this);
    }
});

import { createServer } from 'http'
import express from 'express';
import session from "express-session";
import {Server} from "socket.io";
import Redis from "ioredis";
import { S3Client } from '@aws-sdk/client-s3'
import multerS3 from 'multer-s3'
import multer, {FileFilterCallback} from 'multer';
import {createAdapter} from "@socket.io/redis-adapter";
import rateLimit from "express-rate-limit";
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'
import cors from 'cors'
import path from "path";

import * as routes from "./routes";
import authMiddleware from "./middlewares/auth";
import MongoStore from 'connect-mongo'
import logger from "./utils/logger";
import {EventData} from "./types/event";
import './utils/message';
import process from "process";
import redisClient from "./lib/redis";

import dummyUpload from './utils/dummyUpload'; // TODO: remove this once we are able to upload to s3
import { connectMongo } from './db/mongo';

declare module 'express-session' {
    interface SessionData {
        wallet: string
        username: string
        bio: string
        token: string
    }
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const isStaging = process.env.NODE_ENV === 'staging';
const enableBot = !!process.env.TELEGRAM_ENABLE;

const limiter = rateLimit({
    windowMs: 60000, // 15 minutes
    limit: 60, // Limit each IP to 100 requests per `window` (here, per 60 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
})

const whitelist = [
    'http://localhost:3000',
    'http://localhost:4000',
    'https://api.dump.fun',
    'https://dump.fun',
    'https://www.dump.fun'
]
const app = express();
const server = createServer(app);
const pubClient = new Redis(process.env.REDIS_URI as string);
const subClient = pubClient.duplicate();
subClient.on('connect', () => {
    logger.info('Redis server connected');
});

subClient.on('error', (error: any) => {
    logger.error('Redis SUB connection error:', error);
});
const io = new Server(server, {
    adapter: createAdapter(pubClient, subClient, {
        publishOnSpecificResponseChannel: true
    }),
    cors: {
        origin: function (origin, callback) {
            if (!origin || whitelist.indexOf(origin) !== -1) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        methods: ['POST', 'GET'],
    }
});
const port = process.env.PORT || 4000;
export const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.BUCKETEER_PURPLE_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.BUCKETEER_PURPLE_AWS_SECRET_ACCESS_KEY as string,
    },
    region: process.env.BUCKETEER_PURPLE_AWS_REGION as string
})
const storage =  multerS3({
    s3: s3,
    bucket: process.env.BUCKETEER_PURPLE_BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
        cb(null, Date.now().toString())
    }
});
const sessionMiddleware = session({
    name: process.env.COOKIE_NAME,
    secret: process.env.COOKIE_SECRET as string,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
    ...(process.env.COOKIE_DOMAIN === 'localhost' ? { path: '/' } : {}),
    ...(process.env.COOKIE_DOMAIN !== 'localhost' ? { domain: process.env.COOKIE_DOMAIN } : {}),
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
  }
});
const fileFilter = (req: Express.Request, file: Express.MulterS3.File, cb: FileFilterCallback) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Error: Images Only!'));
    }
};

const upload = multer({ storage: storage, fileFilter });

if (!isDevelopment || isStaging) {
    app.set('trust proxy', '127.0.0.1');
}

connectMongo();

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error(`Origin: ${origin} is Not allowed by CORS`))
        }
    },
    credentials: true,
    methods: ['POST', 'GET']
}));

app.use(sessionMiddleware)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

io.engine.use(sessionMiddleware);
io.use((socket, next) => {
    const { roomid } = socket.handshake.headers
    const { token } = (socket.request as any).session || {};
    if (token || roomid) {
        socket.data.roomId = token || roomid as string;
        next();
    } else {
        next(new Error('Authentication error'));
    }
});

const sendEvent = (token: string) => (eventData: EventData) => {
    io.to(token).emit('event', eventData);
};

const broadcastMessage = (message: string) => {
    io.emit('broadcast', message)
};

app.use(express.static(path.join(__dirname, '..', 'public')));

app.all('/', async (req: any, res: any) => {
    return res.send('Are you lost ?')
})

app.get('/auth/session', routes.session)
app.post('/auth/login', routes.login)
app.post('/auth/logout', routes.logout)
// app.post('/verify', routes.verify)
app.get('/search-coins', routes.searchCoins)
app.get('/coin', routes.coin)
app.get('/top-coin', routes.topCoin)
app.get('/latest-transaction', routes.latestTransaction)
app.get('/latest-coin-created', routes.latestCoinCreated)
app.get('/users-to-follow', routes.usersToFollow)
app.get('/user-profile', routes.userProfile)

// use auth middleware for all endpoints below
app.use(authMiddleware)
app.post('/create-coin', dummyUpload.single('image'), routes.createCoin)
app.post('/buy', routes.buy)
app.post('/sell', routes.sell)
app.post('/post-comment', routes.postComment)
app.post('/post-contract-address', routes.postContractAddress)
app.post('/update-user-profile', routes.updateUserProfile)
app.post('/follow', routes.follow)

// Only rate limit the long running operations
app.use(limiter)

app.post('/upload', upload.single('file'), routes.upload)

app.all('*', async (req: any, res: any) => {
    return res.send('Are you lost ?')
});

server.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing server...`);

    subClient.disconnect()
    pubClient.disconnect()
    redisClient.disconnect()
    console.log('All workers closed. Exiting process.');
    process.exit();
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason: any, promise) => {
    const errorMessage = reason?.message || 'Unknown error';
    const errorName = reason?.name || 'Error';

    logger.error(`Unhandled Rejection : ${errorName}: ${errorMessage}`, {
        stackTrace: reason?.stack
    });
});

process.on('uncaughtException', (err: any) => {
    logger.error('Uncaught Exception:', err);
    // Perform any necessary cleanup or logging operations here
});


export { sendEvent, broadcastMessage }