import { Eureka } from 'eureka-js-client';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';


dotenv.config();

const {
    EUREKA_APP_NAME = 'whatsapp-svc',
    EUREKA_INSTANCE_PORT = '4000',
    EUREKA_INSTANCE_HOST = os.hostname(),
    EUREKA_INSTANCE_IP = '127.0.0.1',
    EUREKA_SERVER_HOST = 'localhost',
    EUREKA_SERVER_PORT = '8761',
    EUREKA_SERVICE_PATH = '/eureka/apps/',
} = process.env;

// Dynamic instance ID
const instanceId = `${EUREKA_APP_NAME}-${EUREKA_INSTANCE_HOST}-${EUREKA_INSTANCE_PORT}-${uuidv4().substring(0, 8)}`;

export const eurekaClient = new Eureka({
    instance: {
        app: EUREKA_APP_NAME,
        instanceId,
        hostName: EUREKA_INSTANCE_HOST,
        ipAddr: EUREKA_INSTANCE_IP,
        port: {
            $: parseInt(EUREKA_INSTANCE_PORT, 10),
            '@enabled': true,
        },
        vipAddress: EUREKA_APP_NAME,
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: EUREKA_SERVER_HOST,
        port: parseInt(EUREKA_SERVER_PORT, 10),
        servicePath: EUREKA_SERVICE_PATH,
    },
});
