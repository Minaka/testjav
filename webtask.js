'use latest';
import { fromExpress } from 'webtask-tools';

import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import request from 'request';
import rp from 'request-promise';

let key = '91bc853f****'; // Thay bằng key của 
let idolPerson = [];

const app = express();

app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

app.post('/', (req, res) => {
  let imageUrl = req.body.url;
  recognize(imageUrl).then(result => {
    res.status(200).json(result);
  }).catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = fromExpress(app);

function detect(imageUrl) {
    console.log(`Begin to detect face from image: ${imageUrl}`);
    let url = `https://api.projectoxford.ai/face/v1.0/detect`;
    return rp({
        method: 'POST',
        uri: url,
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        body: {
            url: imageUrl
        },
        json: true
    });
}

function identify(faceIds) {
    console.log(`Begin to identity face.`);
    let url = 'https://api.projectoxford.ai/face/v1.0/identify';
    return rp({
        method: 'POST',
        uri: url,
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        body: {
            "personGroupId": 'vav-idols',
            "faceIds": faceIds,
            "maxNumOfCandidatesReturned": 1,
        },
        json: true
    });
}

function mapResultToIdol(result, faces) {
      var allIdols = result.map(result => {

        // Lấy vị trí khuôn mặt trong ảnh để hiển thị
        result.face = faces.filter(face => face.faceId == result.faceId)[0].faceRectangle;
        
        // Tìm idol đã được nhận diện từ DB
        if (result.candidates.length > 0) {
            // Kết quả chỉ trả về ID, dựa vào ID này ta tìm tên của idol
            var idolId = result.candidates[0].personId;
            var idol = idolPerson.filter(person => person.personId == idolId)[0];
            result.idol = {
                id: idol.userData,
                name: idol.name
            };
        } else {
            result.idol = {
                id: 0,
                name: 'Unknown'
            }
        }
        
        return result;
    });

    console.log(`Finish recognize image.`);
    return allIdols;
}

// Nhận diện vị trí khuôn mặt và tên idol từ URL ảnh
function recognize(imageUrl) {
    console.log(`Begin to recognize image: ${imageUrl}`);
    let faces = [];
    return detect(imageUrl)
    .then(result => {
      faces = result;
      console.log(faces);
      return faces.map(face => face.faceId);
    })
    .then(identify)
    .then(identifiedResult => {
       return mapResultToIdol(identifiedResult, faces);
    });
}
// Thay bằng nội dung trong file idol-person.json của bạn
idolPerson = [
  {
    "personId": "033947bc-761d-4c93-a751-99b89c70718c",
    "persistedFaceIds": [
    ],
    "name": "Thuỷ Top",
    "userData": "6"
  }
];

