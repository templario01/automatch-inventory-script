const amqp = require('amqplib');
const crypto = require('crypto');

async function sendToQueue() {
    const queue = process.env.RABBITMQ_QUEUE_NAME || 'sold_inventory_queue';

    const payload = Buffer
        .from(JSON.stringify({
            soldVehicles: [{
                "id": "6855b2f1d424d3fc9622d442",
                "condition": "USED",
                "createdAt": "2025-06-20T19:13:51.540Z",
                "currency": "USD",
                "description": "VERSIÓN Compass Longitude 4x2 1.3, GARANTÍA DIVEMOTOR",
                "externalId": "1838660",
                "frontImage": "https://cde.neoauto.pe/autos_usados/196x165/470963/470963_8280457.webp",
                "images": null,
                "location": "Lima, Lima",
                "mileage": 1000,
                "name": "jeep compass 2025",
                "originalPrice": 29500,
                "price": 29500,
                "status": "INACTIVE",
                "transmission": null,
                "updatedAt": "2025-07-19T06:30:26.468Z",
                "url": "https://neoauto.com/auto/seminuevo/jeep-compass-2025-1838660",
                "websiteId": "6855b22a2f467f6344696828",
                "year": 2025,
                "website": {
                    "name": "neoauto"
                },
            },
            {
                "id": "6855b2fed424d3fc9622d455",
                "condition": "USED",
                "createdAt": "2025-06-20T19:13:51.540Z",
                "currency": "USD",
                "description": "ASX 2WD GLS CVT, ASIENTOS DE CUERO, CAMARA DE RETROCESO",
                "externalId": "1839433",
                "frontImage": "https://cde.neoauto.pe/autos_usados/196x165/746429/746429_4363015.webp",
                "images": null,
                "location": "Lima, Lima",
                "mileage": 16500,
                "name": "mitsubishi asx 2024",
                "originalPrice": 19300,
                "price": 19300,
                "status": "INACTIVE",
                "transmission": null,
                "updatedAt": "2025-07-19T06:30:26.468Z",
                "url": "https://neoauto.com/auto/seminuevo/mitsubishi-asx-2024-1839433",
                "websiteId": "6855b22a2f467f6344696828",
                "year": 2024,
                "website": {
                    "name": "neoauto"
                },
            }]
        }))
        .toString('base64');


    let connection;
    try {
        connection = await amqp.connect(process.env.RABBIT_MQ_HOST);
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, { durable: true });

        const wrappedMessage = {
            pattern: queue,
            data: payload
        };

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(wrappedMessage), 'utf8'), { persistent: true, messageId: crypto.randomUUID() });
        console.log(`Payload sent to queue "${queue}":`, payload);

        await channel.close();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

sendToQueue();