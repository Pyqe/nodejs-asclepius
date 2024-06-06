const Hapi = require('@hapi/hapi');
const { loadModel, predict } = require('./inference');

(async () => {
    const model = await loadModel();
    console.log('Model loaded!');
    
    const server = Hapi.server({
        host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
        port: 8000
    });

    server.route({
        method: 'POST',
        path: '/predict',
        handler: async (request, h) => {
            try {
                const { image } = request.payload;

                const maxFileSize = 1000000;
                if (image.length > maxFileSize) {
                    return h.response({
                        "status": "fail",
                        "message": "Payload content length greater than maximum allowed: 1000000"
                    }).code(413);
                }

                const predictions = await predict(model, image);
                let verdict = "";
                if (predictions[0] > .50) {
                    verdict = "Cancer";
                } else {
                    verdict = "Non-cancer";
                }

                return h.response({
                    "status": "success",
                    "message": "Model is predicted successfully",
                    "data": {
                        "id": "77bd90fc-c126-4ceb-828d-f048dddff746",
                        "result": verdict,
                        "suggestion": "Hati-hati!",
                        "createdAt": "2023-12-22T08:26:41.834Z"
                    }
                }).code(201);
            } catch {
                return h.response({
                    "status": "fail",
                    "message": "Terjadi kesalahan dalam melakukan prediksi"
                }).code(400);
            }
        },
        
        options: {
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 100000000
            }
        }
    });

    await server.start();

    console.log(`Server start at: ${server.info.uri}`);
})();