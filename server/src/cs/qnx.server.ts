import * as net from 'net';

import { setting } from '../setting';
import { cmsLib } from "./cms.server";
import { mainService } from '../main-service';
import { mainData } from '../data/main.data';
import { mainState } from '../data/main.state';
import { fileSys } from '../file-sys.lib';
import { handleReceivedCsv } from "../cs/main-no-tcpip-check-param.server";

class SwitchAdapterObj {
    allDeviceNumbers = mainData.webSets[mainState.webSetIndex].webUrlObjs.map(obj => obj.deviceNumber);
    constructor(public recipeName: string, public deviceNumber: string) { 
    }
}

export let qnxLib = {
    CsvBuffer: Buffer.alloc(0),
    isSocketAlive: false,
    socket: null as net.Socket | null,
    isUploadingRecipe: false,
    isDownloadingCsv: false,
    uploadRecipeRes: (msg: string) => { },
    uploadRecipeRej: (msg: string) => { },
    DownloadCSV(deviceNum: string) {
        if (!qnxLib.isSocketAlive || !qnxLib.socket) {
            const msg = `未與Qnx連線，下載Csv下載Csv作業取消`;
            mainService.logBothErr(msg);
            return;
        }
        if (qnxLib.isDownloadingCsv) {
            const msg = 'QnxDownloadCsv中，請稍後再重新嘗試';
            mainService.logBothErr(msg);
            return;
        }
        qnxLib.socket.write('get_data_dt.csv' + JSON.stringify(new SwitchAdapterObj("XXX",deviceNum)));

    },
    tellUploadRecipeInfoP(recipeName: string, deviceNum: string): { isTold: boolean, prom: Promise<void> } {
        let returnObj = {
            isTold: false,
            prom: Promise.resolve(),
        };
        if (!qnxLib.isSocketAlive || !qnxLib.socket) {
            const msg = `偵測到Recipe：${recipeName}，但因未與Qnx連線，上傳Recipe作業取消`;
            mainService.logBothErr(msg);
            return returnObj;
        }
        if (qnxLib.isUploadingRecipe) {
            const msg = 'Qnx上傳Recipe中，請稍後再重新嘗試';
            mainService.logBothErr(msg);
            return returnObj;
        }
        qnxLib.socket.write('switch-adpater-obj' + JSON.stringify(new SwitchAdapterObj(recipeName, deviceNum)));
        returnObj.isTold = true;
        returnObj.prom = new Promise((res, rej) => {
            qnxLib.uploadRecipeRes = res as any;
            qnxLib.uploadRecipeRej = rej as any;
        }).then(() => {
            qnxLib.isUploadingRecipe = false;
        }).catch(err => {
            qnxLib.isUploadingRecipe = false;
            mainService.logBothErr(err);
            return Promise.reject()
        });

        qnxLib.isUploadingRecipe = true;
        return returnObj;
    },
    serve() {
        let excelContent = Buffer.alloc(0)
        let port = setting.listenQnxPort;
        //create server
        let server = net.createServer();
        //start server with a port to listen to
        server.listen(port, function () {
            const msg = `TCP Server start. Waiting for Qnx at port:${port}.`;
            cmsLib.sendDataLog(msg);
            console.log(msg);
        });

        //main connection event, will return a connection i.e. socket
        server.on('connection', function (socket) {
            let succMsg = 'A connection to QNX server has been established.';
            console.log(succMsg);
            cmsLib.sendDataLog(succMsg);
            qnxLib.socket = socket;
            qnxLib.isSocketAlive = true;
            //write
            //  socket.write('Hello, client.');

            //receive
            socket.on('data', function (data: Buffer) {
                let dataStr = data.toString();
                console.log(dataStr);
                if ('DownloadCSV_End' === dataStr) {
                    mainService.logBoth("結束下載data_dt的資料");
                    handleReceivedCsv("data_dt.csv", excelContent);
                    qnxLib.isDownloadingCsv = false;
                }
                if (qnxLib.isDownloadingCsv) {
                    mainService.logBoth("取得Csv檔的資料")
                    excelContent = Buffer.concat([excelContent, data]);
                }
                if ('DownloadCSV_Start' === dataStr) {
                    mainService.logBoth("開始下載data_dt的資料");
                    excelContent = Buffer.alloc(0);
                    qnxLib.isDownloadingCsv = true;
                }
                
                if ('finish-uploading-recipe' === dataStr) {
                    qnxLib.uploadRecipeRes('Qnx端上傳Recipe完成');
                }
                else if ('failed-to-recipe' === dataStr) {
                    qnxLib.uploadRecipeRej('Qnx端上傳Recipe失敗');
                }
            });

            //end
            socket.on('end', function () {
                let msg = '連線結束';
                console.log(msg);
                cmsLib.sendDataLog(msg);
                qnxLib.uploadRecipeRej('因與QNX連線中止，Recipe上傳流程失敗');
                qnxLib.isSocketAlive = false;
           
            });

            //error
            socket.on('error', function (err) {
                let msg = typeof err === 'string' ? err : '與Qnx連線中斷';
                cmsLib.sendErrLog(msg);
                qnxLib.isSocketAlive = false;
                console.log(`Error: ${msg}`);
                qnxLib.uploadRecipeRej('因與QNX連線中止，Recipe上傳流程失敗');
            });
        });
    }
}